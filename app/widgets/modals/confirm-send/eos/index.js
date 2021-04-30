import Ractive from 'widgets/modals/base';
import emitter from 'lib/emitter';
import { unlock, lock } from 'lib/wallet/security';
import { showError, showSuccess } from 'widgets/modals/flash';
import { toUnitString } from 'lib/convert';
import content from './_content.ract';

function open(data) {

  const ractive = new Ractive({
    partials: {
      content,
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

  function handleTransactionError(err) {
    if (err.message === 'cs-node-error') {
      err.message = 'Network node error. Please try again later.';
      err.interpolations = { network: 'EOS' };
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
  data.feeSign = '+';
  data.fee = toUnitString(wallet.getDefaultFee());
  return data;
}

export default open;
