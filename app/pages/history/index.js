'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const { toUnitString } = require('lib/convert');
const { getWallet } = require('lib/wallet');
const strftime = require('strftime');
const { showError } = require('widgets/modals/flash');
const showTransactionDetail = require('widgets/modals/transaction-detail');
const initEosSetup = require('widgets/eos/setup');
const _ = require('lodash');

module.exports = function(el) {
  let network = '';
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      transactions: [],
      formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return strftime('%b %d %l:%M %p', date);
      },
      formatConfirmations(number) {
        if (network === 'ripple') return '';
        if (network === 'stellar') return '';
        if (network === 'eos') return '';
        if (number === 1) {
          return number + ' confirmation';
        } else {
          return number + ' confirmations';
        }
      },
      getToAddress(tx) {
        if (network === 'ethereum' || network === 'ripple' || network === 'eos') {
          return tx.to;
        } else if (network === 'stellar') {
          return tx.operations[0] && tx.operations[0].destination;
        } else if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash'].indexOf(network) !== -1) {
          return tx.outs[0].address;
        }
      },
      isConfirmed(confirmations) {
        if (network === 'ripple') return true;
        if (network === 'stellar') return true;
        if (network === 'eos') return true;
        return confirmations >= getWallet().minConf;
      },
      isFailed(tx) {
        if (network === 'ethereum' || network === 'ripple') {
          return tx.status === false;
        // eslint-disable-next-line max-len
        } else if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash', 'stellar'].indexOf(network) !== -1) {
          return false;
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
    network = wallet.networkName;
    ractive.set('needToSetupEos', wallet.networkName === 'eos' && !wallet.isActive);
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

  emitter.on('sync', () => {
    isSyncing = true;
    ractive.set('transactions', []);
    ractive.set('isLoading', true);
    isLoadingStarted = false;
  });

  ractive.on('show-detail', (context) => {
    const index = context.node.getAttribute('data-index');
    const data = {
      transaction: ractive.get('transactions')[index],
      formatTimestamp: ractive.get('formatTimestamp'),
      formatConfirmations: ractive.get('formatConfirmations'),
      isFailed: ractive.get('isFailed'),
      isConfirmed: ractive.get('isConfirmed'),
      toUnitString: ractive.get('toUnitString'),
      isNetwork(str) {
        return str === network;
      },
    };
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
          message: 'Network node error. Please try again later.',
          interpolations: { network: _.upperFirst(wallet.networkName) },
        });
      } else {
        console.error(err);
        showError({ message: err.message });
      }
    });
  }

  return ractive;
};
