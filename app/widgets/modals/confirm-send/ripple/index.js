'use strict';

const Ractive = require('widgets/modals/base');
const emitter = require('lib/emitter');
const { showInfo, showError, showSuccess } = require('widgets/modals/flash');
const { unlock, lock } = require('lib/wallet/security');
const { toUnitString } = require('lib/convert');

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
        if (data.importTxOptions && /Less than minimum reserve/.test(err.message)) {
          return showInfo({
            title: 'Insufficient funds',
            message: "Your wallet isn't activated. You can receive only amount greater than :minReserve :denomination.",
            interpolations: { minReserve: toUnitString(wallet.getMinReserve()), denomination: wallet.denomination },
          });
        }
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

      wallet.sendTx(tx, (err) => {
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
    if (err.message === 'tecNO_DST_INSUF_XRP') {
      // eslint-disable-next-line max-len
      err.message = "Recipient's wallet isn't activated. You can send only amount greater than :minReserve :denomination.";
      err.interpolations = {
        minReserve: toUnitString(wallet.getMinReserve()),
        denomination: wallet.denomination,
      };
    } else if (err.message === 'tecDST_TAG_NEEDED') {
      err.message = "Recipient's wallet requires a destination tag.";
    } else if (err.message === 'cs-node-error') {
      err.message = 'Network node error. Please try again later.';
      err.interpolations = { network: 'Ripple' };
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
  data.fee = toUnitString(wallet.getDefaultFee());
  return data;
}

module.exports = open;
