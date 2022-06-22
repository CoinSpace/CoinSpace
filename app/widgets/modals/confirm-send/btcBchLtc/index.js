import Ractive from 'widgets/modals/base';
import emitter from 'lib/emitter';
import { toAtom, toUnitString } from 'lib/convert';
import { showInfo, showError } from 'widgets/modals/flash';
import { translate } from 'lib/i18n';
import { unlock, lock } from 'lib/wallet/security';
import content from './_content.ract';

function open(options) {

  const { data, wallet, importTxOptions } = options;
  const feesData = {};
  if (importTxOptions) {
    feesData.feeName = 'default';
    const { unspents, privateKey } = importTxOptions;
    const estimates = wallet.estimateFees(toAtom(data.amount), { unspents, privateKey });
    const fees = estimates.map((item) => {
      return {
        ...item,
        estimate: toUnitString(item.estimate),
      };
    });
    feesData.fees = fees;
    feesData.fee = fees.find((item) => item.name === feesData.feeName).estimate;
  }

  const ractive = new Ractive({
    partials: {
      content: options.content || content,
    },
    data: {
      ...data,
      ...feesData,
    },
  });

  ractive.on('change-fee', () => {
    const feeName = ractive.get('feeName');
    ractive.set('fee', ractive.get('fees').find((item) => item.name === feeName).estimate);
  });

  ractive.on('send', () => {
    ractive.set('isLoading', true);
    setTimeout(async () => {
      let tx;

      try {
        tx = createTx();
      } catch (err) {
        ractive.set('isLoading', false);
        if (/Insufficient funds/.test(err.message)) return showInfo({ title: translate('Insufficient funds') });
        return handleTransactionError(err);
      }

      try {
        await unlock(wallet);
        tx = await tx.sign();
        lock(wallet);
      } catch (err) {
        lock(wallet);
        if (err.message !== 'cancelled') console.error(err);
        return ractive.set('isLoading', false);
      }

      try {
        const historyTx = await wallet.sendTx(tx);

        options.onSuccess(ractive);

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
    if (options.importTxOptions) {
      options.importTxOptions.fee = toAtom(ractive.get('fee'));
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
      message = translate('Network node error. Please try again later.', {
        network: wallet.crypto.name,
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

export default open;
