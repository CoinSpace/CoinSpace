import Ractive from 'widgets/modals/base';
import emitter from 'lib/emitter';
import { toAtom, toUnitString } from 'lib/convert';
import { showInfo, showError, showSuccess } from 'widgets/modals/flash';
import { translate } from 'lib/i18n';
import _ from 'lodash';
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

  ractive.on('change-fee', () => {
    const feeName = ractive.get('feeName');
    ractive.set('fee', ractive.get('fees').find((item) => item.name === feeName).estimate);
  });

  ractive.on('send', () => {
    ractive.set('sending', true);
    setTimeout(async () => {
      let tx;

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
        emitter.emit('append-transactions', [historyTx]);
      } catch (err) {
        return handleTransactionError(err);
      }
    }, 200);
  });

  function createTx() {
    let tx;
    const fee = toAtom(ractive.get('fee'));
    if (data.importTxOptions) {
      data.importTxOptions.fee = fee;
      tx = wallet.createImportTx(data.importTxOptions);
    } else {
      // eslint-disable-next-line prefer-destructuring
      tx = data.tx;
    }
    return tx;
  }

  function handleTransactionError(err) {
    let message;
    if (err.message === 'cs-node-error') {
      message = translate('Network node error. Please try again later.', {
        network: _.upperFirst(wallet.networkName),
      });
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

  data.feeSign = data.importTxOptions ? '-' : '+';
  data.isBitcoin = wallet.networkName === 'bitcoin';

  const unspents = data.importTxOptions ? data.importTxOptions.unspents : null;

  if (data.importTxOptions) {
    data.showImportTxFees = true;
    data.feeName = 'default';

    const estimates = wallet.estimateFees(toAtom(data.amount), unspents);
    const fees = estimates.map((item) => {
      if (item.default === true) {
        data.feeName = item.name;
      }
      return {
        ...item,
        estimate: toUnitString(item.estimate),
      };
    });

    data.fees = fees;
    data.fee = fees.find((item) => item.name === data.feeName).estimate;
  }

  return data;
}

export default open;
