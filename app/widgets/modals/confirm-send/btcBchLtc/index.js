'use strict';

var Ractive = require('widgets/modals/base');
var emitter = require('lib/emitter');
var getWallet = require('lib/wallet').getWallet;
var parseHistoryTx = require('lib/wallet').parseHistoryTx;
var toAtom = require('lib/convert').toAtom;
var toUnitString = require('lib/convert').toUnitString;
var showInfo = require('widgets/modals/flash').showInfo;
var getTokenNetwork = require('lib/token').getTokenNetwork;
var _ = require('lodash');

function open(data) {

  var ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
      error: require('../error.ract'),
      success: require('../success.ract')
    },
    data: extendData(data)
  });

  ractive.on('change-fee', function() {
    var index = ractive.get('feeIndex');
    ractive.set('fee', ractive.get('fees')[index].estimate);
  });

  ractive.on('send', function() {
    ractive.set('sending', true);
    setTimeout(function() {
      var wallet = getWallet();
      var tx;

      try {
        tx = createTx();
      } catch(err) {
        ractive.set('sending', false);
        if (/Insufficient funds/.test(err.message)) return showInfo({title: 'Insufficient funds'});
        return handleTransactionError(err);
      }

      wallet.sendTx(tx, function (err, historyTx) {
        if (err) return handleTransactionError(err);

        ractive.set('confirmation', false);
        ractive.set('success', true);
        ractive.set('onDismiss', data.onSuccessDismiss);

        // update balance & tx history
        emitter.emit('tx-sent');
        if (historyTx) {
          emitter.emit('append-transactions', [parseHistoryTx(historyTx)]);
        }
      });
    }, 200);
  });

  function createTx() {
    var wallet = getWallet();
    var tx;
    var fee = toAtom(ractive.get('fee'));
    if (data.importTxOptions) {
      data.importTxOptions.fee = fee;
      tx = wallet.createImportTx(data.importTxOptions);
    } else {
      tx = data.tx;
    }
    return tx;
  }

  function handleTransactionError(err) {
    ractive.set('confirmation', false)
    if (err.message === 'cs-node-error') {
      err.message = 'Network node error. Please try again later.'
      ractive.set('interpolations', { network: _.upperFirst(getTokenNetwork()) })
    } else {
      console.error(err);
    }
    ractive.set('error', err.message)
  }

  return ractive
}

function extendData(data) {

  var network = getTokenNetwork();

  data.confirmation = true;
  data.feeSign = data.importTxOptions ? '-' : '+';
  data.isBitcoin = network === 'bitcoin';

  var wallet = getWallet();
  var unspents = data.importTxOptions ? data.importTxOptions.unspents : null;

  if (data.importTxOptions) {
    data.showImportTxFees = true;
    data.feeIndex = 0;

    var estimates = wallet.estimateFees(toAtom(data.amount), unspents);
    var fees = wallet.feeRates.map(function(item, i) {
      item.estimate = toUnitString(estimates[i]);
      return item;
    });

    for (var i = 0; i< wallet.feeRates.length; i++) {
      if (wallet.feeRates[i].default) {
        data.feeIndex = i;
        break;
      }
    }
    data.fees = fees;
    data.fee = fees[data.feeIndex].estimate;
  }

  return data;
}

module.exports = open
