import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import { toUnitString } from 'lib/convert';
import { getWallet } from 'lib/wallet';
import strftime from 'strftime';
import { showError } from 'widgets/modals/flash';
import { translate } from 'lib/i18n';
import showTransactionDetail from 'widgets/modals/transaction-detail';
import initEosSetup from 'widgets/eos/setup';
import template from './index.ract';

export default function(el) {
  let platform = '';
  const ractive = new Ractive({
    el,
    template,
    data: {
      transactions: [],
      formatTimestamp(timestamp) {
        return strftime('%b %d, %Y %l:%M %p', new Date(timestamp));
      },
      getToAddress(tx) {
        if (['ethereum', 'ripple', 'eos', 'binance-smart-chain', 'ethereum-classic', 'solana'].includes(platform)) {
          return tx.to;
        } else if (platform === 'stellar') {
          return tx.operations[0] && tx.operations[0].destination;
        } else if (['bitcoin', 'bitcoin-cash', 'bitcoin-sv', 'litecoin', 'dogecoin', 'dash', 'cardano']
          .includes(platform)) {
          return tx.outs[0].address;
        } else if (platform === 'monero') {
          return translate('Sent');
        }
      },
      toUnitString,
      isLoading: true,
      hasMore: false,
      isLoadingMore: false,
    },
  });

  initEosSetup(ractive.find('#eos-setup'));

  let isLoadingStarted = false;
  let isSyncing = true;

  ractive.on('before-show', () => {
    loadTxs();
  });

  emitter.on('wallet-ready', () => {
    isSyncing = false;
    const wallet = getWallet();
    ({ platform } = wallet.crypto);
    ractive.set('needToSetupEos', wallet.crypto.platform === 'eos' && !wallet.isActive);
    if (ractive.el.classList.contains('current')) loadTxs();
  });

  function loadTxs() {
    if (isSyncing) return;
    if (isLoadingStarted) return;
    isLoadingStarted = true;
    ractive.set('transactions', []);
    loadTxsWithLoader('isLoading');
  }

  emitter.on('append-transactions', (newTxs) => {
    newTxs.forEach((tx) => {
      ractive.unshift('transactions', tx);
    });
  });

  emitter.on('replace-transaction', ({ tx, newTx }) => {
    const i = ractive.get('transactions').indexOf(tx);
    ractive.splice('transactions', i, 1, newTx);
  });

  emitter.on('sync', () => {
    isSyncing = true;
    ractive.set('transactions', []);
    ractive.set('isLoading', true);
    isLoadingStarted = false;
  });

  ractive.on('show-detail', (context) => {
    const index = context.node.getAttribute('data-index');
    const data = { transaction: ractive.get('transactions')[index] };
    showTransactionDetail(data);
  });

  ractive.on('load-more', () => {
    ractive.set('isLoadingMore', true);
    loadTxsWithLoader('isLoadingMore');
  });

  function loadTxsWithLoader(loaderKey) {
    const wallet = getWallet();
    wallet.loadTxs().then((result) => {
      ractive.set(loaderKey, false);
      ractive.set('hasMore', result.hasMoreTxs);
      result.txs.forEach((tx) => {
        ractive.push('transactions', tx);
      });
    }).catch((err) => {
      ractive.set(loaderKey, false);
      if (err.message === 'cs-node-error') {
        showError({
          message: translate('Network node error. Please try again later.', {
            network: wallet.crypto.name,
          }),
        });
      } else {
        console.error(`not translated error: ${err.message}`);
        showError({ message: err.message });
      }
    });
  }

  return ractive;
}
