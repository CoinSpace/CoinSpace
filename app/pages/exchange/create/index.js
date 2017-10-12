'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var getWallet = require('lib/wallet').getWallet;
var denominations = require('lib/denomination');
var getNetwork = require('lib/network');
var shapeshift = require('lib/shapeshift');
var qrcode = require('lib/qrcode');
var geo = require('lib/geo');
var showTooltip = require('widgets/modal-tooltip');
var isEthereum = getNetwork() === 'ethereum';
var showError = require('widgets/modal-flash').showError;

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
      isLoadingRate: true,
      qrScannerAvailable: qrcode.isScanAvailable,
      isValidating: false,
      fromSymbol: denominations[getNetwork()].default,
      returnAddress: '',
      toAddress: '',
      toSymbol: '',
      rate: '',
      coins: [],
      isGeoEnabled: function(symbol) {
        return Object.keys(geo.networks).indexOf(symbol) !== -1;
      }
    },
    partials: {
      loader: require('../loader.ract'),
      footer: require('../footer.ract')
    }
  });

  ractive.on('before-show', function() {
    shapeshift.getCoins().then(function(coins) {
      ractive.set('isLoading', false);
      ractive.set('coins', coins);

      var fromSymbol = ractive.get('fromSymbol');
      if (fromSymbol === ractive.get('toSymbol')) {
        var symbol = getFirstEnabledSymbol(coins, fromSymbol);
        ractive.set('toSymbol', symbol);
      } else {
        return getRate();
      }
    }).catch(function(err) {
      console.error(err);
    });
  });

  ractive.observe('fromSymbol', function(symbol, old) {
    if (!old) return;
    if (symbol === ractive.get('toSymbol')) {
      return ractive.set('toSymbol', old);
    }
    return getRate();
  });

  ractive.observe('toSymbol', function(symbol, old) {
    if (!old) return;
    if (symbol === ractive.get('fromSymbol')) {
      return ractive.set('fromSymbol', old);
    }
    return getRate();
  });

  ractive.on('clearAddress', function(context) {
    var dataContext = context.node.getAttribute('data-context');
    if (dataContext === 'exchange-to-address') {
      ractive.set('toAddress', '');
      ractive.find('#exchange_to_address').focus();
    } else if (dataContext === 'exchange-return-address') {
      ractive.set('returnAddress', '');
      ractive.find('#exchange_return_address').focus();
    }
  });

  ractive.on('open-geo', function(context) {
    var dataContext = context.node.getAttribute('data-context');
    var data = {
      overlay: 'geo',
      context: dataContext,
    };

    if (dataContext === 'exchange-return-address') {
      data.network = geo.networks[ractive.get('fromSymbol')]
    } else if (dataContext === 'exchange-to-address') {
      data.network = geo.networks[ractive.get('toSymbol')]
    }
    emitter.emit('open-overlay', data);
  });

  ractive.on('open-qr', function(context) {
    qrcode.scan({
      context: context.node.getAttribute('data-context'),
      isEthereum: isEthereum
    });
  });

  emitter.on('prefill-wallet', function(address, context) {
    if (context === 'exchange-return-address') {
      ractive.set('returnAddress', address)
    } else if (context === 'exchange-to-address') {
      ractive.set('toAddress', address)
    }
  })

  ractive.on('help', function() {
    showTooltip({
      message: 'Text here'
    });
  });

  ractive.on('swap', function() {
    ractive.set('fromSymbol', ractive.get('toSymbol'));
    var returnAddress = ractive.get('returnAddress');
    ractive.set('returnAddress', ractive.get('toAddress'));
    ractive.set('toAddress', returnAddress);
  });

  ractive.on('confirm', function() {
    var options = {
      fromSymbol: ractive.get('fromSymbol'),
      returnAddress: ractive.get('returnAddress'),
      toAddress: ractive.get('toAddress'),
      toSymbol: ractive.get('toSymbol')
    };
    return validateAddresses(options).then(function() {
      return shapeshift.shift(options).then(function(data) {
        ractive.set('isValidating', false);
        console.log('data', data);

        // save to local db and replicate it

        // go to next page
        // emitter.emit('change-exchange-step', 'awaitingDeposit', {
        //   depositAddress: 'LfmssDyX6iZvbVqHv6t9P6JWXia2JG7mdb',
        //   depositSymbol: 'LTC',
        //   depositMax: '13.4868',
        //   depositMin: '0.02299247 LTC',
        //   toSymbol: 'BTC',
        //   toAddress: '1N4h6WwnUaVgoDSh1X4cAcq294N1sKnwm1',
        // });
      });
    }).catch(function(err) {
      ractive.set('isValidating', false);
      if (err.message === 'invalid_return_address') {
        return showError({message: 'Please enter a valid return address'});
      }
      if (err.message === 'invalid_to_address') {
        return showError({message: 'Please enter a valid address to send to'});
      }
      console.error(err);
    });
  });

  function validateAddresses(options) {
    ractive.set('isValidating', true);
    var promises = [];
    if (options.returnAddress) {
      promises.push(shapeshift.validateAddress(options.returnAddress, options.fromSymbol));
    } else {
      promises.push(Promise.resolve(true));
    }
    promises.push(shapeshift.validateAddress(options.toAddress, options.toSymbol));

    return Promise.all(promises).then(function(results) {
      if (!results[0]) throw new Error('invalid_return_address');
      if (!results[1]) throw new Error('invalid_to_address');
    });
  }

  emitter.on('wallet-ready', function(){
    if (ractive.get('fromSymbol') === getWallet().denomination) {
      ractive.set('returnAddress', getWallet().getNextAddress());
    }
  });

  function getFirstEnabledSymbol(coins, ignoreSymbol) {
    var nextCoin = null;
    coins.some(function(coin) {
      if (!coin.disabled && coin.symbol !== ignoreSymbol) {
        nextCoin = coin;
        return true;
      }
    });
    return nextCoin ? nextCoin.symbol : nextCoin;
  }

  function getRate() {
    ractive.set('isLoadingRate', true);
    return shapeshift.getRate(ractive.get('fromSymbol'), ractive.get('toSymbol')).then(function(rate) {
      ractive.set('isLoadingRate', false);
      ractive.set('rate', rate);
    });
  }

  return ractive;
}
