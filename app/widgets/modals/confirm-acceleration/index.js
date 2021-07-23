import Ractive from 'widgets/modals/base';
import emitter from 'lib/emitter';
import { getWallet } from 'lib/wallet';
import { unlock, lock } from 'lib/wallet/security';
import { showError, showSuccess } from 'widgets/modals/flash';
import { translate } from 'lib/i18n';
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
    try {
      const historyTx = await wallet.sendTx(tx);
      showSuccess({
        el: ractive.el,
        title: translate('Acceleration Successful'),
        message: translate('Your transaction will be replaced in your history tab shortly.'),
        fadeInDuration: 0,
      });
      // update balance & tx history
      emitter.emit('tx-sent');
      emitter.emit('replace-transaction', {
        tx: tx.replaceByFeeTx,
        newTx: historyTx,
      });
    } catch (err) {
      return handleTransactionError(err);
    }
  });

  function handleTransactionError(err) {
    let message;
    if (err.message === 'cs-node-error') {
      message = translate('Network node error. Please try again later.', {
        network: _.upperFirst(wallet.networkName),
      });
    } else {
      console.error(`not translated error: ${err.message}`);
      // eslint-disable-next-line prefer-destructuring
      message = err.message;
    }
    showError({
      el: ractive.el,
      title: translate('Acceleration Failed'),
      message,
      fadeInDuration: 0,
    });
  }

  return ractive;
}

export default open;
