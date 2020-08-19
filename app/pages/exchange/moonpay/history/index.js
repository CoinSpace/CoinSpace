'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const moonpay = require('lib/moonpay');
const strftime = require('strftime');
const Big = require('big.js');
const showTransactionDetail = require('widgets/modals/moonpay/transaction-detail');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
      txs: [],
      showDetail(tx) {
        showTransactionDetail({
          tx,
          onSuccessDismiss() {
            ractive.show();
          },
        });
      },
    },
    partials: {
      loader: require('../loader.ract'),
    },
  });

  ractive.on('before-show', () => {
    ractive.set('isLoading', true);
    ractive.set('txs', []);
    return moonpay.getTxs().then((txs) => {
      ractive.set('isLoading', false);
      txs.forEach((tx) => {
        tx.currencyCode = moonpay.getCryptoSymbolById(tx.currencyId);
        const fiat = moonpay.getFiatById(tx.baseCurrencyId);
        const amount = Big(tx.baseCurrencyAmount).plus(tx.feeAmount).plus(tx.extraFeeAmount).toFixed(fiat.precision);
        tx.fiat = amount + ' ' + fiat.symbol;
        tx.timestamp = strftime('%b %d %l:%M %p', (new Date(tx.createdAt)));
      });
      ractive.set('txs', txs);
    }).catch((err) => {
      ractive.set('isLoading', false);
      console.error(err);
    });
  });

  ractive.on('back', () => {
    emitter.emit('change-moonpay-step', 'main');
  });

  return ractive;
};
