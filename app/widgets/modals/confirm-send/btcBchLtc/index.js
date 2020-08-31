'use strict';

const Ractive = require('widgets/modals/base');
const emitter = require('lib/emitter');
const { getWallet } = require('lib/wallet');
const { toAtom } = require('lib/convert');
const { toUnitString } = require('lib/convert');
const { showInfo } = require('widgets/modals/flash');
const { getTokenNetwork } = require('lib/token');
const _ = require('lodash');

function open(data) {

  const ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
      error: require('../error.ract'),
      success: require('../success.ract'),
    },
    data: extendData(data),
  });

  ractive.on('change-fee', () => {
    const index = ractive.get('feeIndex');
    ractive.set('fee', ractive.get('fees')[index].estimate);
  });

  ractive.on('send', () => {
    ractive.set('sending', true);
    setTimeout(() => {
      const wallet = getWallet();
      let tx;

      try {
        tx = createTx();
      } catch (err) {
        ractive.set('sending', false);
        if (/Insufficient funds/.test(err.message)) return showInfo({ title: 'Insufficient funds' });
        return handleTransactionError(err);
      }

      tx = tx.sign();

      wallet.sendTx(tx, (err, historyTx) => {
        if (err) return handleTransactionError(err);

        ractive.set('confirmation', false);
        ractive.set('success', true);
        ractive.set('onDismiss', data.onSuccessDismiss);

        // update balance & tx history
        emitter.emit('tx-sent');
        if (historyTx) {
          emitter.emit('append-transactions', [historyTx]);
        }
      });
    }, 200);
  });

  function createTx() {
    const wallet = getWallet();
    let tx;
    const fee = toAtom(ractive.get('fee'));
    if (data.importTxOptions) {
      data.importTxOptions.fee = fee;
      tx = wallet.createImportTx(data.importTxOptions);
    } else {
      // eslint-disable-next-line prefer-destructuring
      tx = data.tx;
    }
    return tx;
  }

  function handleTransactionError(err) {
    ractive.set('confirmation', false);
    if (err.message === 'cs-node-error') {
      err.message = 'Network node error. Please try again later.';
      ractive.set('interpolations', { network: _.upperFirst(getTokenNetwork()) });
    } else {
      console.error(err);
    }
    ractive.set('error', err.message);
  }

  return ractive;
}

function extendData(data) {

  const network = getTokenNetwork();

  data.confirmation = true;
  data.feeSign = data.importTxOptions ? '-' : '+';
  data.isBitcoin = network === 'bitcoin';

  const wallet = getWallet();
  const unspents = data.importTxOptions ? data.importTxOptions.unspents : null;

  if (data.importTxOptions) {
    data.showImportTxFees = true;
    data.feeIndex = 0;

    const estimates = wallet.estimateFees(toAtom(data.amount), unspents);
    const fees = wallet.feeRates.map((item, i) => {
      item.estimate = toUnitString(estimates[i]);
      return item;
    });

    for (let i = 0; i< wallet.feeRates.length; i++) {
      if (wallet.feeRates[i].default) {
        data.feeIndex = i;
        break;
      }
    }
    data.fees = fees;
    data.fee = fees[data.feeIndex].estimate;
  }

  return data;
}

module.exports = open;
