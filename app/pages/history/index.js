'use strict';

var Ractive = require('lib/ractive')
var emitter = require('lib/emitter')
var toUnitString = require('lib/convert').toUnitString
var getTokenNetwork = require('lib/token').getTokenNetwork;
var getWallet = require('lib/wallet').getWallet
var strftime = require('strftime')
var showTransactionDetail = require('widgets/modals/transaction-detail')

module.exports = function(el){
  var network = getTokenNetwork();
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      transactions: [],
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
        } else if (['bitcoin', 'bitcoincash', 'litecoin', 'testnet'].indexOf(network) !== -1) {
          return tx.outs[0].address;
        }
      },
      isReceived: function(tx) {
        if (network === 'ethereum') {
          return tx.to === getWallet().addressString;
        } else if (['bitcoin', 'bitcoincash', 'litecoin', 'testnet'].indexOf(network) !== -1) {
          return tx.amount > 0;
        }
      },
      isConfirmed: function(confirmations) {
        return confirmations >= getWallet().minConf;
      },
      isFailed: function(tx) {
        if (network === 'ethereum') {
          return tx.status === false;
        } else if (['bitcoin', 'bitcoincash', 'litecoin', 'testnet'].indexOf(network) !== -1) {
          return false;
        }
      },
      toUnitString: toUnitString,
      loadingTx: true,
    }
  })

  emitter.on('append-transactions', function(newTxs){
    newTxs.forEach(function(tx) {
      ractive.unshift('transactions', tx);
    })
    ractive.set('loadingTx', false)
  })

  emitter.on('set-transactions', function(txs) {
    network = getTokenNetwork();
    ractive.set('transactions', txs)
    ractive.set('loadingTx', false)
  })

  emitter.on('sync', function() {
    ractive.set('transactions', [])
    ractive.set('loadingTx', true)
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

  return ractive
}
