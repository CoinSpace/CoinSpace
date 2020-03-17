'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var getWallet = require('lib/wallet').getWallet;
var changelly = require('lib/changelly');
var qrcode = require('lib/qrcode');
var geo = require('lib/geo');
var showTooltip = require('widgets/modals/tooltip');
var showError = require('widgets/modals/flash').showError;
var db = require('lib/db');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      qrScannerAvailable: qrcode.isScanAvailable,
      isValidating: false,
      fromSymbol: '',
      returnAddress: '',
      toAddress: '',
      toSymbol: '',
      isGeoEnabled: function(symbol) {
        return Object.keys(geo.networks).indexOf(symbol) !== -1;
      }
    },
    partials: {
      loader: require('../loader.ract'),
      footer: require('../footer.ract')
    }
  });

  ractive.on('before-show', function(context) {
    ractive.set('fromAmount', context.fromAmount);
    ractive.set('fromSymbol', context.fromSymbol);
    ractive.set('toSymbol', context.toSymbol);
    ractive.set('networkFee', context.networkFee);

    var wallet = getWallet();
    if (wallet) {
      ractive.set('returnAddress', context.fromSymbol === wallet.denomination ? wallet.getNextAddress() : '');
      ractive.set('toAddress', context.toSymbol === wallet.denomination ? wallet.getNextAddress() : '');
    }
  });

  ractive.on('back', function() {
    emitter.emit('change-changelly-step', 'enterAmount', {isBack: true});
  });

  ractive.on('clearAddress', function(context) {
    var dataContext = context.node.getAttribute('data-context');
    if (dataContext === 'changelly-to-address') {
      ractive.set('toAddress', '');
      ractive.find('#changelly_to_address').focus();
    } else if (dataContext === 'changelly-return-address') {
      ractive.set('returnAddress', '');
      ractive.find('#changelly_return_address').focus();
    }
  });

  ractive.on('open-geo', function(context) {
    var dataContext = context.node.getAttribute('data-context');
    var data = {
      overlay: 'geo',
      context: dataContext,
    };

    if (dataContext === 'changelly-return-address') {
      data.network = geo.networks[ractive.get('fromSymbol')]
    } else if (dataContext === 'changelly-to-address') {
      data.network = geo.networks[ractive.get('toSymbol')]
    }
    emitter.emit('open-overlay', data);
  });

  ractive.on('open-qr', function(context) {
    qrcode.scan({
      context: context.node.getAttribute('data-context')
    });
  });

  emitter.on('prefill-wallet', function(address, context) {
    if (context === 'changelly-return-address') {
      ractive.set('returnAddress', address)
    } else if (context === 'changelly-to-address') {
      ractive.set('toAddress', address)
    }
  })

  ractive.on('help', function() {
    showTooltip({
      message: 'Return address should be an address controlled by you where ' +
      'deposit will be returned in the event of a failed transaction.'
    });
  });

  ractive.on('confirm', function() {
    var options = {
      fromSymbol: ractive.get('fromSymbol'),
      returnAddress: ractive.get('returnAddress').trim(),
      toAddress: ractive.get('toAddress').trim(),
      toSymbol: ractive.get('toSymbol'),
      fromAmount: ractive.get('fromAmount')
    };
    return validateAddresses(options).then(function() {
      return changelly.createTransaction(options).then(function(data) {
        data.networkFee = ractive.get('networkFee');
        db.set('changellyInfo', data).then(function() {
          ractive.set('isValidating', false);
          emitter.emit('change-changelly-step', 'awaitingDeposit', data);
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
      if (err.message === 'exchange_error') {
        return showError({message: 'Exchange error'});
      }
      console.error(err.message);
      return showError({message: err.message});
    });
  });

  function validateAddresses(options) {
    ractive.set('isValidating', true);
    var promises = [];
    if (options.returnAddress) {
      promises.push(changelly.validateAddress(options.returnAddress, options.fromSymbol));
    } else {
      promises.push(Promise.resolve(true));
    }
    promises.push(changelly.validateAddress(options.toAddress, options.toSymbol));

    return Promise.all(promises).then(function(results) {
      if (!results[0]) throw new Error('invalid_return_address');
      if (!results[1]) throw new Error('invalid_to_address');
    });
  }

  return ractive;
}
