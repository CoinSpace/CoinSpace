'use strict';

var Ractive = require('cs-ractive')
var emitter = require('cs-emitter')
var toUnitString = require('cs-convert').toUnitString
var getNetwork = require('cs-network')
var getWallet = require('cs-wallet-js').getWallet
var strftime = require('strftime')
var showTransactionDetail = require('cs-modal-transaction-detail')

var WatchModule = require('cs-watch-module')

module.exports = function(el){
  var transactions = []
  var network = getNetwork();
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract').template,
    data: {
      transactions: transactions,
      formatTimestamp: function(timestamp){
        var date = new Date(timestamp)
        return strftime('%b %d %l:%M %p', date)
      },
      formatConfirmations: function(number){
        if (number === 1) {
          return number + ' confirmation'
        } else {
          return number + ' confirmations'
        }
      },
      getToAddress: function(tx) {
        if (network === 'ethereum') {
          return tx.to;
        } else if (network === 'bitcoin' || network === 'litecoin' || network === 'testnet') {
          return tx.outs[0].address;
        }
      },
      isReceived: function(tx) {
        if (network === 'ethereum') {
          return tx.to === getWallet().addressString;
        } else if (network === 'bitcoin' || network === 'litecoin' || network === 'testnet') {
          return tx.amount > 0;
        }
      },
      isConfirmed: function(confirmations) {
        return confirmations >= getWallet().minConf;
      },
      toUnitString: toUnitString,
      isEthereum: network === 'ethereum',
      isBitcoin: network === 'bitcoin' || network === 'testnet',
      isLitecoin: network === 'litecoin',
      loadingTx: true,
    }
  })

  emitter.on('append-transactions', function(newTxs){
    newTxs.forEach(function(tx) {
      transactions.unshift(tx)
    })
    ractive.set('loadingTx', false)
  })

  emitter.on('set-transactions', function(newTxs) {
    transactions = newTxs
    ractive.set('transactions', transactions)
    ractive.set('loadingTx', false)
    if (window.buildPlatform === 'ios') {
      var response = {}
      response.command = 'transactionMessage'
      response.transactions = newTxs

      WatchModule.setTransactionHistory(newTxs)

      WatchModule.sendMessage(response, 'comandAnswerQueue')
    }
  })

  emitter.on('sync-click', function() {
    transactions = []
    ractive.set('transactions', transactions)
    ractive.set('loadingTx', true)
  })

  ractive.on('show-detail', function(event) {
    var index = event.node.getAttribute('data-index')
    var data = ractive.data
    data.transaction = ractive.get('transactions')[index]
    showTransactionDetail(data)
  })

  return ractive
}
