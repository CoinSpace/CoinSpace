'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var moonpay = require('lib/moonpay');
var strftime = require('strftime');
var Big = require('big.js');
var showTransactionDetail = require('widgets/modals/moonpay/transaction-detail');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
      txs: [],
      showDetail: function(tx) {
        showTransactionDetail({
          tx: tx,
          onSuccessDismiss: function() {
            ractive.show();
          }
        });
      }
    },
    partials: {
      loader: require('../loader.ract'),
    }
  });

  ractive.on('before-show', function() {
    ractive.set('isLoading', true);
    return moonpay.getTxs().then(function(txs) {
      ractive.set('isLoading', false);
      txs.forEach(function(tx) {
        tx.currencyCode = moonpay.getCryptoSymbolById(tx.currencyId);
        var fiat = moonpay.getFiatById(tx.baseCurrencyId);
        var amount = Big(tx.baseCurrencyAmount).plus(tx.feeAmount).plus(tx.extraFeeAmount).toFixed(fiat.precision);
        tx.fiat = fiat.sign + amount;
        tx.timestamp = strftime('%b %d %l:%M %p', (new Date(tx.createdAt)));
      });
      ractive.set('txs', txs);
    }).catch(function(err) {
      ractive.set('isLoading', false);
      console.error(err);
    });
  });

  ractive.on('back', function() {
    emitter.emit('change-moonpay-step', 'main');
  });

  return ractive;
}
