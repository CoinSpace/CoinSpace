'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var getWallet = require('lib/wallet').getWallet;
var denomination = require('lib/denomination');
var getTokenNetwork = require('lib/token').getTokenNetwork;
var shapeshift = require('lib/shapeshift');
var qrcode = require('lib/qrcode');
var geo = require('lib/geo');
var showTooltip = require('widgets/modals/tooltip');
var showError = require('widgets/modals/flash').showError;
var showInfo = require('widgets/modals/flash').showInfo;
var _ = require('lodash');
var db = require('lib/db');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
      isLogged: shapeshift.isLogged(),
      isLoadingRate: true,
      qrScannerAvailable: qrcode.isScanAvailable,
      isValidating: false,
      fromSymbol: '',
      returnAddress: '',
      toAddress: '',
      toSymbol: '',
      rate: '?',
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

  ractive.on('login', function() {
    shapeshift.login().then(function() {
      ractive.set('isLogged', true);
    }).catch(function(err) {
      if (err.message === 'user_is_not_verified') {
        return showInfo({
          message: 'Your ShapeShift account is not verified.',
          href: 'https://auth.shapeshift.io',
          linkText: 'Complete verification'
        })
      }
    });
  });

  ractive.on('logout', function() {
    shapeshift.logout().then(function() {
      ractive.set('isLogged', false);
    });
  });

  var fromSymbolObserver = ractive.observe('fromSymbol', function(symbol, old) {
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

  ractive.on('before-show', function() {
    shapeshift.getCoins().then(function(coins) {
      ractive.set('isLoading', false);
      ractive.set('coins', coins);

      fromSymbolObserver.silence();
      ractive.set('fromSymbol', denomination(getTokenNetwork()));
      fromSymbolObserver.resume();

      var fromSymbol = ractive.get('fromSymbol');
      if (fromSymbol === ractive.get('toSymbol')) {
        var symbol = getFirstEnabledSymbol(coins, fromSymbol);
        ractive.set('toSymbol', symbol);
      } else {
        return getRate();
      }
    }).catch(function(err) {
      console.error(err);
      return showError({message: err.message});
    });
  });

  ractive.on('before-hide', function() {
    ractive.set('isLoading', true);
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
      isEthereum: getTokenNetwork() === 'ethereum'
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
      message: 'Return address should be an address controlled by you where ' +
      'deposit will be returned in the event of a failed transaction.'
    });
  });

  ractive.on('swap', function() {
    ractive.set('fromSymbol', ractive.get('toSymbol'));
    var returnAddress = ractive.get('returnAddress');
    ractive.set('returnAddress', ractive.get('toAddress'));
    ractive.set('toAddress', returnAddress);

    // Fix safari placeholder bug
    var returnAddressEl = ractive.find('#exchange_return_address');
    returnAddressEl.focus();
    returnAddressEl.blur();
    var toAddressEl = ractive.find('#exchange_to_address');
    toAddressEl.focus();
    toAddressEl.blur();
  });

  ractive.on('confirm', function() {
    if (ractive.get('rate') === '?') return showError({message: 'Exchange is currently unavailable for this pair'});
    var options = {
      fromSymbol: ractive.get('fromSymbol'),
      returnAddress: ractive.get('returnAddress'),
      toAddress: ractive.get('toAddress'),
      toSymbol: ractive.get('toSymbol')
    };
    var fromCoin = _.find(ractive.get('coins'), function(item) {
      return item.symbol === options.fromSymbol;
    });
    return validateAddresses(options).then(function() {
      return shapeshift.shift(options).then(function(data) {
        data.depositCoinName = fromCoin ? fromCoin.name : '';
        db.set('exchangeInfo', data).then(function() {
          ractive.set('isValidating', false);
          emitter.emit('change-exchange-step', 'awaitingDeposit', data);
        }).catch(function(err) {
          ractive.set('isValidating', false);
          console.error(err);
        });
      });
    }).catch(function(err) {
      ractive.set('isValidating', false);
      if (err.message === 'invalid_return_address') {
        return showError({message: 'Please enter a valid return address'});
      }
      if (err.message === 'invalid_to_address') {
        return showError({message: 'Please enter a valid address to send to'});
      }
      if (/Please use the precise/.test(err.message)) {
        return showError({message: 'Exchange is currently unavailable for this pair'});
      }
      if (/Invalid or Expired Authorization Token/.test(err.message)) {
        ractive.set('isLogged', false);
        shapeshift.cleanAccessToken();
        return showError({message: 'Try to sign in again'});
      }
      console.error(err.message);
      return showError({message: err.message});
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

  emitter.on('wallet-ready', function() {
    if (!ractive.el.classList.contains('current')) {
      return ractive.set('returnAddress', getWallet().getNextAddress());
    }
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
    return shapeshift.marketInfo(ractive.get('fromSymbol'), ractive.get('toSymbol')).then(function(data) {
      var rate = data.rate;
      ractive.set('isLoadingRate', false);
      ractive.set('rate', rate);
    }).catch(function(err) {
      ractive.set('isLoadingRate', false);
      ractive.set('rate', '?');
      if (/Pair (.+) is currently unavailable/.test(err.message)) return // silence
      console.error(err);
      return showError({message: err.message});
    });
  }

  return ractive;
}
