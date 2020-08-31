'use strict';

const Ractive = require('widgets/modals/base');
const emitter = require('lib/emitter');
const { getWallet } = require('lib/wallet');

function open(data) {

  const ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
      error: require('../error.ract'),
      success: require('../success.ract'),
    },
    data: extendData(data),
  });

  ractive.on('send', () => {
    ractive.set('sending', true);
    setTimeout(() => {
      const wallet = getWallet();
      const { tx } = data;

      tx = tx.sign();

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
  data.confirmation = true;
  const wallet = getWallet();

  data.feeSign = '+';
  data.fee = wallet.getDefaultFee();

  return data;
}

module.exports = open;
