'use strict';

const Ractive = require('widgets/modals/base');
const emitter = require('lib/emitter');
const { showInfo } = require('widgets/modals/flash');

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
    setTimeout(() => {
      let tx = null;

      try {
        tx = createTx();
      } catch (err) {
        ractive.set('sending', false);
        if (/Insufficient funds/.test(err.message)) return showInfo({ title: 'Insufficient funds' });
        if (data.importTxOptions && /Less than minimum reserve/.test(err.message)) {
          return showInfo({
            title: 'Insufficient funds',
            message: "Your wallet isn't activated. You can receive only amount greater than :minReserve :denomination.",
            interpolations: { minReserve: wallet.minReserve, denomination: wallet.denomination },
          });
        }
        return handleTransactionError(err);
      }

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
    ractive.set('confirmation', false);
    if (err.message === 'tecNO_DST_INSUF_XRP') {
      // eslint-disable-next-line max-len
      err.message = "Recipient's wallet isn't activated. You can send only amount greater than :minReserve :denomination.";
      ractive.set('interpolations', {
        minReserve: wallet.minReserve,
        denomination: wallet.denomination,
      });
    } else if (err.message === 'tecDST_TAG_NEEDED') {
      err.message = "Recipient's wallet requires a destination tag.";
    } else if (err.message === 'cs-node-error') {
      err.message = 'Network node error. Please try again later.';
      ractive.set('interpolations', { network: 'Ripple' });
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
  data.fee = wallet.getDefaultFee();
  return data;
}

module.exports = open;
