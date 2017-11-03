'use strict';

var Ractive = require('widgets/modal');
var showError = require('widgets/modal-flash').showError;
var qrcode = require('lib/qrcode');
var showConfirmation = require('widgets/modal-confirm-send');
var showInfo = require('widgets/modal-flash').showInfo;
var getWallet = require('lib/wallet').getWallet;
var getDynamicFees = require('lib/wallet').getDynamicFees;
var toUnitString = require('lib/convert').toUnitString;

function open() {

  var ractive = new Ractive({
    partials: {
      content: require('./_content.ract')
    },
    data: {
      isLoading: false,
      qrScannerAvailable: qrcode.isScanAvailable
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
      if (importTxOptions.amount === 0) {
        ractive.set('isLoading', false);
        return showInfo({message: 'This private key has no coins for transfer.'});
      }
      importTxOptions.to = to;
      getDynamicFees(function(dynamicFees) {
        showConfirmation({
          to: importTxOptions.to,
          amount: toUnitString(importTxOptions.amount),
          denomination: wallet.denomination,
          dynamicFees: dynamicFees,
          fadeInDuration: 0,
          importTxOptions: importTxOptions
        });
      });

    }).catch(handleError);
  });

  function handleError(err) {
    ractive.set('isLoading', false);
    showError({message: err.message});
  }

  return ractive;
}

module.exports = open
