import Ractive from 'widgets/modals/base';
import emitter from 'lib/emitter';
import { unlock, lock } from 'lib/wallet/security';
import { showError } from 'widgets/modals/flash';
import { translate } from 'lib/i18n';
import content from './_content.ract';

function open(options) {

  const ractive = new Ractive({
    partials: {
      content: options.content || content,
    },
    data: options.data,
  });
  const { wallet } = options;

  ractive.on('send', () => {
    ractive.set('isLoading', true);
    setTimeout(async () => {
      let { tx } = options;

      try {
        await unlock(wallet);
        tx = tx.sign();
        lock(wallet);
      } catch (err) {
        lock(wallet);
        if (err.message !== 'cancelled') console.error(err);
        return ractive.set('isLoading', false);
      }
      try {
        await wallet.sendTx(tx);

        options.onSuccess(ractive);

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
      console.error(`not translated error: ${err.message}`);
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

export default open;
