import Ractive from 'widgets/modals/base';
import emitter from 'lib/emitter';
import { toUnitString } from 'lib/convert';
import { showInfo, showError, showSuccess } from 'widgets/modals/flash';
import { translate } from 'lib/i18n';
import { unlock, lock } from 'lib/wallet/security';
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
      let tx = null;

      try {
        tx = createTx();
      } catch (err) {
        ractive.set('sending', false);
        if (/Insufficient funds/.test(err.message)) return showInfo({ title: translate('Insufficient funds') });
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

      try {
        const historyTx = await wallet.sendTx(tx);
        if (data.onSuccessDismiss) data.onSuccessDismiss();
        showSuccess({
          el: ractive.el,
          title: translate('Transaction Successful'),
          message: translate('Your transaction will appear in your history tab shortly.'),
          fadeInDuration: 0,
        });

        // update balance & tx history
        emitter.emit('tx-sent');
        if (historyTx) {
          emitter.emit('append-transactions', [historyTx]);
        }
      } catch (err) {
        return handleTransactionError(err);
      }
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
    if (err.message === 'cs-node-error') {
      err.message = translate('Network node error. Please try again later.', { network: wallet.crypto.name });
    } else {
      console.error(err);
    }
    showError({
      el: ractive.el,
      title: translate('Transaction Failed'),
      message: err.message,
      fadeInDuration: 0,
    });
  }

  return ractive;
}

function extendData(data) {
  const { wallet } = data;
  data.feeSign = data.importTxOptions ? '-' : '+';
  data.fee = toUnitString(wallet.defaultFee, 18);
  data.feeSymbol = wallet.platformCrypto.symbol;
  data.blockchain = wallet.platformCrypto.name;
  return data;
}

export default open;
