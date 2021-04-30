import Ractive from 'widgets/modals/base';
import emitter from 'lib/emitter';
import { getWallet } from 'lib/wallet';
import { unlock, lock } from 'lib/wallet/security';
import { showError, showSuccess } from 'widgets/modals/flash';
import { toUnitString } from 'lib/convert';
import _ from 'lodash';
import content from './_content.ract';

function open(data) {

  const wallet = getWallet();
  let { tx } = data;

  const ractive = new Ractive({
    el: data.el || Ractive.prototype.el,
    partials: {
      content,
    },
    data: Object.assign(data, {
      isLoading: false,
      replaceByFeePercent: `+${((wallet.replaceByFeeFactor - 1) * 100).toFixed(0)}%`,
      denomination: wallet.denomination,
      amount: toUnitString(tx.amount),
    }),
  });

  ractive.on('confirm', async () => {
    ractive.set('isLoading', true);

    try {
      await unlock(wallet);
      tx = tx.sign();
      lock(wallet);
    } catch (err) {
      lock(wallet);
      if (err.message !== 'cancelled') console.error(err);
      return ractive.set('isLoading', false);
    }

    wallet.sendTx(tx, (err, historyTx) => {
      if (err) return handleTransactionError(err);
      showSuccess({
        el: ractive.el,
        title: 'Acceleration Successful',
        message: 'Your transaction will be replaced in your history tab shortly.',
        fadeInDuration: 0,
      });
      // update balance & tx history
      emitter.emit('tx-sent');
      emitter.emit('replace-transaction', {
        tx: tx.replaceByFeeTx,
        newTx: historyTx,
      });
    });

  });

  function handleTransactionError(err) {
    if (err.message === 'cs-node-error') {
      err.message = 'Network node error. Please try again later.';
      err.interpolations = { network: _.upperFirst(wallet.networkName) };
    } else {
      console.error(err);
    }
    showError({
      el: ractive.el,
      title: 'Acceleration Failed',
      message: err.message,
      interpolations: err.interpolations,
      fadeInDuration: 0,
    });
  }

  return ractive;
}

export default open;
