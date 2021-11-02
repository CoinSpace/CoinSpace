import Ractive from 'widgets/modals/base';
import emitter from 'lib/emitter';
import { showInfo, showError } from 'widgets/modals/flash';
import { translate } from 'lib/i18n';
import { unlock, lock } from 'lib/wallet/security';
import { toUnitString } from 'lib/convert';
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
      let tx = null;

      try {
        tx = createTx();
      } catch (err) {
        ractive.set('isLoading', false);
        if (/Insufficient funds/.test(err.message)) return showInfo({ title: translate('Insufficient funds') });
        if (options.importTxOptions && /Less than minimum reserve/.test(err.message)) {
          return showInfo({
            title: translate('Insufficient funds'),
            // eslint-disable-next-line max-len
            message: translate("Your wallet isn't activated. You can receive only amount greater than :minReserve :symbol.", {
              minReserve: toUnitString(wallet.minReserve),
              symbol: wallet.crypto.symbol,
            }),
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

  function createTx() {
    let tx;
    if (options.importTxOptions) {
      tx = wallet.createImportTx(options.importTxOptions);
    } else {
      // eslint-disable-next-line prefer-destructuring
      tx = options.tx;
    }

    return tx;
  }

  function handleTransactionError(err) {
    let message;
    if (err.message === 'cs-node-error') {
      message = translate('Network node error. Please try again later.', { network: 'Stellar' });
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
