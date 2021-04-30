import Ractive from 'widgets/modals/base';
import emitter from 'lib/emitter';
import { toAtom, toUnitString } from 'lib/convert';
import { showInfo, showError, showSuccess } from 'widgets/modals/flash';
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
    const index = ractive.get('feeIndex');
    ractive.set('fee', ractive.get('fees')[index].estimate);
  });

  ractive.on('send', () => {
    ractive.set('sending', true);
    setTimeout(async () => {
      let tx;

      try {
        tx = createTx();
      } catch (err) {
        ractive.set('sending', false);
        if (/Insufficient funds/.test(err.message)) return showInfo({ title: 'Insufficient funds' });
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

      wallet.sendTx(tx, (err, historyTx) => {
        if (err) return handleTransactionError(err);

        if (data.onSuccessDismiss) data.onSuccessDismiss();
        showSuccess({
          el: ractive.el,
          title: 'Transaction Successful',
          message: 'Your transaction will appear in your history tab shortly.',
          fadeInDuration: 0,
        });

        // update balance & tx history
        emitter.emit('tx-sent');
        emitter.emit('append-transactions', [historyTx]);
      });
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
    if (err.message === 'cs-node-error') {
      err.message = 'Network node error. Please try again later.';
      err.interpolations = { network: _.upperFirst(wallet.networkName) };
    } else {
      console.error(err);
    }
    showError({
      el: ractive.el,
      title: 'Transaction Failed',
      message: err.message,
      interpolations: err.interpolations,
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
    data.feeIndex = 0;

    const feeRates = wallet.getFeeRates();
    const estimates = wallet.estimateFees(toAtom(data.amount), unspents);
    const fees = feeRates.map((item, i) => {
      return Object.assign({
        estimate: toUnitString(estimates[i]),
      }, item);
    });

    for (const i in feeRates) {
      if (feeRates[i].default) {
        data.feeIndex = i;
        break;
      }
    }
    data.fees = fees;
    data.fee = fees[data.feeIndex].estimate;
  }

  return data;
}

export default open;
