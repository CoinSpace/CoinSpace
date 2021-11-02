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
      const { tx } = options;

      try {
        await unlock(wallet);
        // transaction already signed
      } catch (err) {
        lock(wallet);
        if (err.message !== 'cancelled') console.error(err);
        return ractive.set('isLoading', false);
      }

      try {
        const historyTx = await wallet.sendTx(tx);

        lock(wallet);

        options.onSuccess(ractive);

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
      message = translate('Transaction fee is too low. Please click on refresh button.');
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
