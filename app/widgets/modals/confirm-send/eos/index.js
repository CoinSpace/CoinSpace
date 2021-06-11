import Ractive from 'widgets/modals/base';
import emitter from 'lib/emitter';
import { unlock, lock } from 'lib/wallet/security';
import { showError, showSuccess } from 'widgets/modals/flash';
import { translate } from 'lib/i18n';
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
      try {
        await wallet.sendTx(tx);

        if (data.onSuccessDismiss) data.onSuccessDismiss();
        showSuccess({
          el: ractive.el,
          title: translate('Transaction Successful'),
          message: translate('Your transaction will appear in your history tab shortly.'),
          fadeInDuration: 0,
        });

        // update balance & tx history
        emitter.emit('tx-sent');
      } catch (err) {
        return handleTransactionError(err);
      }
    }, 200);
  });

  function handleTransactionError(err) {
    if (err.message === 'cs-node-error') {
      err.message = translate('Network node error. Please try again later.', { network: 'EOS' });
    } else {
      console.error(err);
    }
    showError({
      el: ractive.el,
      title: translate('Transaction Failed'),
      // TODO should we translate unknown error?
      message: err.message,
      fadeInDuration: 0,
    });
  }

  return ractive;
}

function extendData(data) {
  const { wallet } = data;
  data.feeSign = '+';
  data.fee = toUnitString(wallet.defaultFee);
  return data;
}

export default open;
