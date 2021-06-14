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
      const { tx } = data;

      try {
        await unlock(wallet);
        // transaction already signed
      } catch (err) {
        lock(wallet);
        if (err.message !== 'cancelled') console.error(err);
        return ractive.set('sending', false);
      }

      try {
        const historyTx = await wallet.sendTx(tx);

        lock(wallet);

        if (data.onSuccessDismiss) data.onSuccessDismiss();
        showSuccess({
          el: ractive.el,
          title: translate('Transaction Successful'),
          message: translate('Your transaction will appear in your history tab shortly.'),
          fadeInDuration: 0,
        });

        // update balance & tx history
        emitter.emit('tx-sent');
        emitter.emit('append-transactions', [historyTx]);
      } catch (err) {
        return handleTransactionError(err);
      }
    }, 200);
  });

  function handleTransactionError(err) {
    let message;
    if (err.message === 'cs-node-error') {
      message = translate('Network node error. Please try again later.', { network: 'Monero' });
    } else if (/^Transaction fee is too low/.test(err.message)) {
      message = translate('Transaction fee is too low. Please reload your wallet.');
    } else {
      console.error('not translated error:', err);
      // eslint-disable-next-line prefer-destructuring
      message = err.message;
    }
    showError({
      el: ractive.el,
      title: translate('Transaction Failed'),
      message,
      fadeInDuration: 0,
    });
  }

  return ractive;
}

function extendData(data) {
  data.feeSign = '+';
  data.fee = toUnitString(data.tx.fee);
  return data;
}

export default open;
