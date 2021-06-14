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
    let message;
    if (err.message === 'cs-node-error') {
      message = translate('Network node error. Please try again later.', { network: 'EOS' });
    } else if (/^Account does not exist/.test(err.message)) {
      message = translate("Destination account doesn't exist.");
    } else if (/^Expired transaction/.test(err.message)) {
      message = translate('Transaction has been expired. Please try again.');
    } else if (/^CPU usage exceeded/.test(err.message)) {
      // eslint-disable-next-line max-len
      message = translate('Account CPU usage has been exceeded. Please try again later or ask someone to stake you more CPU.');
    } else if (/^NET usage exceeded/.test(err.message)) {
      // eslint-disable-next-line max-len
      message = translate('Account NET usage has been exceeded. Please try again later or ask someone to stake you more NET.');
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
  const { wallet } = data;
  data.feeSign = '+';
  data.fee = toUnitString(wallet.defaultFee);
  return data;
}

export default open;
