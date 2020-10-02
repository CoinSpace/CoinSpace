'use strict';

const Ractive = require('widgets/modals/base');
const emitter = require('lib/emitter');
const { toAtom } = require('lib/convert');
const { toUnitString } = require('lib/convert');
const { showInfo } = require('widgets/modals/flash');
const _ = require('lodash');
const { unlock, lock } = require('lib/wallet/security');

function open(data) {

  const ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
      error: require('../error.ract'),
      success: require('../success.ract'),
    },
    data: extendData(data),
  });
  const { wallet } = data;

  ractive.on('change-fee', () => {
    const index = ractive.get('feeIndex');
    ractive.set('fee', ractive.get('fees')[index].estimate);
  });

  ractive.on('send', () => {
    ractive.set('sending', true);
    setTimeout(async () => {
      let tx;

      try {
        tx = createTx();
      } catch (err) {
        ractive.set('sending', false);
        if (/Insufficient funds/.test(err.message)) return showInfo({ title: 'Insufficient funds' });
        return handleTransactionError(err);
      }

      try {
        await unlock(wallet);
        tx = tx.sign();
        lock(wallet);
      } catch (err) {
        lock(wallet);
        if (err.message !== 'cancelled') console.error(err);
        return ractive.set('sending', false);
      }

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
      ractive.set('interpolations', { network: _.upperFirst(wallet.networkName) });
    } else {
      console.error(err);
    }
    ractive.set('error', err.message);
  }

  return ractive;
}

function extendData(data) {

  const { wallet } = data;

  data.confirmation = true;
  data.feeSign = data.importTxOptions ? '-' : '+';
  data.isBitcoin = wallet.networkName === 'bitcoin';

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
