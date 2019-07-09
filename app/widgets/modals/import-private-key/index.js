'use strict';

var Ractive = require('widgets/modals/base');
var showError = require('widgets/modals/flash').showError;
var qrcode = require('lib/qrcode');
var emitter = require('lib/emitter');
var showConfirmation = require('widgets/modals/confirm-send');
var showInfo = require('widgets/modals/flash').showInfo;
var getWallet = require('lib/wallet').getWallet;
var toUnitString = require('lib/convert').toUnitString;
var getTokenNetwork = require('lib/token').getTokenNetwork;
var _ = require('lodash');

var ractive;

function open() {

  ractive = new Ractive({
    partials: {
      content: require('./_content.ract')
    },
    data: {
      isLoading: false,
      qrScannerAvailable: qrcode.isScanAvailable,
    }
  });

  ractive.on('clearPrivateKey', function() {
    var input = ractive.find('#private_key');
    ractive.set('privateKey', '');
    input.focus();
  });

  ractive.on('transfer', function() {
    ractive.set('isLoading', true);
    var wallet = getWallet();
    var to = wallet.getNextAddress();
    var privateKey;
    try {
      privateKey = wallet.createPrivateKey(ractive.get('privateKey'));
    } catch (err) {
      return handleError(new Error('Invalid private key'));
    }
    wallet.getImportTxOptions(privateKey).then(function(importTxOptions) {
      if (parseFloat(importTxOptions.amount) === 0) {
        ractive.set('isLoading', false);
        return showInfo({message: 'This private key has no coins for transfer.'});
      }
      importTxOptions.to = to;
      showConfirmation({
        to: importTxOptions.to,
        amount: toUnitString(importTxOptions.amount),
        denomination: wallet.denomination,
        fadeInDuration: 0,
        importTxOptions: importTxOptions
      });

    }).catch(handleError);
  });

  ractive.on('open-qr', function() {
    qrcode.scan({context: 'import-private-key'});
  });

  function handleError(err) {
    ractive.set('isLoading', false);
    if (/^Private key equal wallet private key/.test(err.message)) {
      return showError({message: 'Please enter a private key other than your wallet private key'});
    } else if (err.message === 'cs-node-error') {
      return showError({
        message: 'Network node error. Please try again later.',
        interpolations: { network: _.upperFirst(getTokenNetwork()) }
      });
    }
    return showError({message: err.message});
  }

  return ractive;
}

emitter.on('prefill-wallet', function(privateKey, context) {
  if (context !== 'import-private-key' || !ractive) return;
  ractive.set('privateKey', privateKey);
});

module.exports = open
