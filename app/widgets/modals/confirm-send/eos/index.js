'use strict';

const Ractive = require('widgets/modals/base');
const emitter = require('lib/emitter');
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

  ractive.on('send', () => {
    ractive.set('sending', true);
    setTimeout(async () => {
      let { tx } = data;

      try {
        await unlock(wallet);
        tx = tx.sign();
        lock(wallet);
      } catch (err) {
        lock(wallet);
        if (err.message !== 'cancelled') console.error(err);
        return ractive.set('sending', false);
      }

      wallet.sendTx(tx, (err) => {
        if (err) return handleTransactionError(err);

        ractive.set('confirmation', false);
        ractive.set('success', true);
        ractive.set('onDismiss', data.onSuccessDismiss);

        // update balance & tx history
        emitter.emit('tx-sent');
      });
    }, 200);
  });

  function handleTransactionError(err) {
    ractive.set('confirmation', false);
    if (err.message === 'cs-node-error') {
      err.message = 'Network node error. Please try again later.';
      ractive.set('interpolations', { network: 'EOS' });
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
  data.feeSign = '+';
  data.fee = wallet.getDefaultFee();
  return data;
}

module.exports = open;
