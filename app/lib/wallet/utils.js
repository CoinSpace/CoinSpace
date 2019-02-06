'use strict';

var showError = require('widgets/modals/flash').showError;
var getTokenNetwork = require('lib/token').getTokenNetwork;
var emitter = require('lib/emitter');

function parseBtcLtcTx(tx) {
  return {
    id: tx.txId,
    amount: tx.amount,
    timestamp: tx.timestamp * 1000,
    confirmations: tx.confirmations,
    fee: tx.fees,
    ins: tx.vin.map(function(input) {
      return {
        address: input.addr,
        amount: input.valueSat
      }
    }),
    outs: tx.vout.map(function(output) {
      return {
        address: output.scriptPubKey.addresses ? output.scriptPubKey.addresses[0] : null,
        amount: output.valueSat
      }
    })
  }
}

function parseEthereumTx(tx) {
  return {
    id: tx.token ? tx.txId : tx._id,
    amount: tx.value,
    timestamp: tx.timestamp * 1000,
    confirmations: tx.confirmations,
    fee: tx.fee,
    status: tx.status,
    from: tx.from,
    to: tx.to,
    token: tx.token
  }
}

function onSyncDoneWrapper(options) {
  options = options || {};
  var before = options.before || function() {};
  var success = options.success || function() {};
  var fail = options.fail || function(err) {
    showError({message: err.message});
  };
  return function(err) {
    before();
    if (err && err.message !== 'cs-node-error') {
      return fail(err);
    }
    success();
    if (err && err.message === 'cs-node-error') {
      emitter.emit('wallet-block');
      return nodeError();
    } else {
      return emitter.emit('wallet-unblock');
    }
  }
}

function onTxSyncDoneWrapper(options) {
  options = options || {};
  var fail = options.fail || function(err) {
    showError({message: err.message});
  };
  return function(err, txs) {
    if (err) {
      emitter.emit('set-transactions', []);
      if (err.message === 'cs-node-error') {
        return nodeError();
      }
      return fail(err);
    }
    emitter.emit('set-transactions', txs);
  }
}

function nodeError() {
  return showError({
    message: "Can't connect to :network node. Please try again later or choose another token.",
    interpolations: { network: getTokenNetwork() }
  })
}

module.exports = {
  parseBtcLtcTx: parseBtcLtcTx,
  parseEthereumTx: parseEthereumTx,
  onSyncDoneWrapper: onSyncDoneWrapper,
  onTxSyncDoneWrapper: onTxSyncDoneWrapper
}
