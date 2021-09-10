import Ractive from 'widgets/modals/base';
import emitter from 'lib/emitter';
import { showInfo, showError, showSuccess } from 'widgets/modals/flash';
import { translate } from 'lib/i18n';
import { unlock, lock } from 'lib/wallet/security';
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
      let tx = null;

      try {
        tx = await createTx();
      } catch (err) {
        ractive.set('sending', false);
        if (/Insufficient funds/.test(err.message)) return showInfo({ title: translate('Insufficient funds') });
        if (data.importTxOptions && /Less than minimum reserve/.test(err.message)) {
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

  async function createTx() {
    let tx;
    if (data.importTxOptions) {
      tx = await wallet.createImportTx(data.importTxOptions);
    } else {
      // eslint-disable-next-line prefer-destructuring
      tx = data.tx;
    }
    return tx;
  }

  function handleTransactionError(err) {
    let message;
    if (err.message === 'tecNO_DST_INSUF_XRP') {
      // eslint-disable-next-line max-len
      message = translate("Recipient's wallet isn't activated. You can send only amount greater than :minReserve :symbol.", {
        minReserve: toUnitString(wallet.minReserve),
        symbol: wallet.crypto.symbol,
      });
    } else if (err.message === 'tecDST_TAG_NEEDED') {
      message = translate("Recipient's wallet requires a destination tag.");
    } else if (err.message === 'cs-node-error') {
      message = translate('Network node error. Please try again later.', {
        network: 'Ripple',
      });
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

function extendData(data) {
  const { wallet } = data;
  data.feeSign = data.importTxOptions ? '-' : '+';
  data.fee = toUnitString(wallet.defaultFee);
  return data;
}

export default open;
