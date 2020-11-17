'use strict';

const Ractive = require('widgets/modals/base');
const emitter = require('lib/emitter');
const { toUnitString } = require('lib/convert');
const { showInfo, showError, showSuccess } = require('widgets/modals/flash');
const { unlock, lock } = require('lib/wallet/security');

function open(data) {

  const ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
    },
    data: extendData(data),
  });

  const { wallet } = data;

  ractive.on('send', () => {
    ractive.set('sending', true);
    setTimeout(async () => {
      let tx = null;

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

        if (data.onSuccessDismiss) data.onSuccessDismiss();
        showSuccess({
          el: ractive.el,
          title: 'Transaction Successful',
          message: 'Your transaction will appear in your history tab shortly.',
          fadeInDuration: 0,
        });

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
    if (data.importTxOptions) {
      tx = wallet.createImportTx(data.importTxOptions);
    } else {
      // eslint-disable-next-line prefer-destructuring
      tx = data.tx;
    }
    return tx;
  }

  function handleTransactionError(err) {
    if (err.message === 'cs-node-error') {
      err.message = 'Network node error. Please try again later.';
      err.interpolations = { network: 'Ethereum' };
    } else {
      console.error(err);
    }
    showError({
      el: ractive.el,
      title: 'Transaction Failed',
      message: err.message,
      interpolations: err.interpolations,
      fadeInDuration: 0,
    });
  }

  return ractive;
}

function extendData(data) {
  const { wallet } = data;
  data.feeSign = data.importTxOptions ? '-' : '+';
  data.fee = toUnitString(wallet.getDefaultFee(), 18);
  data.feeDenomination = 'ETH';
  return data;
}

module.exports = open;
