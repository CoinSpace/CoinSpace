'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var toUnitString = require('lib/convert').toUnitString;
var getTokenNetwork = require('lib/token').getTokenNetwork;
var getWallet = require('lib/wallet').getWallet;
var parseHistoryTx = require('lib/wallet').parseHistoryTx;
var strftime = require('strftime');
var showError = require('widgets/modals/flash').showError;
var showTransactionDetail = require('widgets/modals/transaction-detail');
var initEosSetup = require('widgets/eos/setup');
var _ = require('lodash');

module.exports = function(el) {
  var network = getTokenNetwork();
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      transactions: [],
      formatTimestamp: function(timestamp) {
        var date = new Date(timestamp)
        return strftime('%b %d %l:%M %p', date)
      },
      formatConfirmations: function(number) {
        if (network === 'ripple') return '';
        if (network === 'stellar') return '';
        if (network === 'eos') return '';
        if (number === 1) {
          return number + ' confirmation';
        } else {
          return number + ' confirmations';
        }
      },
      getToAddress: function(tx) {
        if (network === 'ethereum' || network === 'ripple' || network === 'eos') {
          return tx.to;
        } else if (network === 'stellar') {
          return tx.operations[0] && tx.operations[0].destination;
        } else if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash'].indexOf(network) !== -1) {
          return tx.outs[0].address;
        }
      },
      isReceived: function(tx) {
        if (network === 'ethereum' || network === 'ripple') {
          return tx.to === getWallet().addressString; // TODO: make getWallet().isReceivedTx(tx);
        } else if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash', 'stellar'].indexOf(network) !== -1) {
          return tx.amount > 0;
        } else if (network === 'eos') {
          return getWallet().isReceivedTx(tx);
        }
      },
      isConfirmed: function(confirmations) {
        if (network === 'ripple') return true;
        if (network === 'stellar') return true;
        if (network === 'eos') return true;
        return confirmations >= getWallet().minConf;
      },
      isFailed: function(tx) {
        if (network === 'ethereum' || network === 'ripple') {
          return tx.status === false;
        } else if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash', 'stellar'].indexOf(network) !== -1) {
          return false;
        }
      },
      toUnitString: toUnitString,
      isLoading: true,
      hasMore: false,
      isLoadingMore: false
    }
  })

  initEosSetup(ractive.find('#eos-setup'));

  var isLoadingStarted = false;
  var isSyncing = true;

  ractive.on('before-show', function() {
    loadTxs();
  });

  emitter.on('wallet-ready', function() {
    isSyncing = false;
    var wallet = getWallet();
    network = wallet.networkName;
    ractive.set('needToSetupEos', wallet.networkName === 'eos' && !wallet.isActive);
    if (ractive.el.classList.contains('current')) loadTxs();
  })

  function loadTxs() {
    if (isSyncing) return;
    if (isLoadingStarted) return;
    isLoadingStarted = true;
    loadTxsWithLoader('isLoading');
  }

  emitter.on('append-transactions', function(newTxs) {
    newTxs.forEach(function(tx) {
      ractive.unshift('transactions', tx);
    })
  })

  emitter.on('sync', function() {
    isSyncing = true;
    ractive.set('transactions', [])
    ractive.set('isLoading', true)
    isLoadingStarted = false;
  })

  ractive.on('show-detail', function(context) {
    var index = context.node.getAttribute('data-index')
    var data = {
      transaction: ractive.get('transactions')[index],
      formatTimestamp: ractive.get('formatTimestamp'),
      formatConfirmations: ractive.get('formatConfirmations'),
      isReceived: ractive.get('isReceived'),
      isFailed: ractive.get('isFailed'),
      isConfirmed: ractive.get('isConfirmed'),
      toUnitString: ractive.get('toUnitString'),
      isNetwork: function(str) {
        return str === network
      }
    }
    showTransactionDetail(data)
  })

  ractive.on('load-more', function() {
    ractive.set('isLoadingMore', true);
    loadTxsWithLoader('isLoadingMore');
  })

  function loadTxsWithLoader(loaderKey) {
    var wallet = getWallet();
    wallet.loadTxs().then(function(result) {
      ractive.set(loaderKey, false);
      ractive.set('hasMore', result.hasMoreTxs)
      result.txs.forEach(function(tx) {
        ractive.push('transactions', parseHistoryTx(tx));
      })
    }).catch(function(err) {
      ractive.set(loaderKey, false);
      if (err.message === 'cs-node-error') {
        showError({
          message: 'Network node error. Please try again later.',
          interpolations: { network: _.upperFirst(getTokenNetwork()) }
        });
      } else {
        console.error(err);
        showError({message: err.message});
      }
    })
  }

  return ractive
}
