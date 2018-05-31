'use strict';

var Ractive = require('widgets/modals/base');
var emitter = require('lib/emitter');
var getWallet = require('lib/wallet').getWallet;
var parseHistoryTx = require('lib/wallet').parseHistoryTx;
var toAtom = require('lib/convert').toAtom;
var toUnitString = require('lib/convert').toUnitString;
var bitcoin = require('cs-wallet').bitcoin;
var showInfo = require('widgets/modals/flash').showInfo;
var getTokenNetwork = require('lib/token').getTokenNetwork;

function open(data) {

  var ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
      error: require('../error.ract'),
      success: require('../success.ract')
    },
    data: extendData(data)
  });

  ractive.on('send', function() {
    ractive.set('sending', true);
    var wallet = getWallet();
    var tx = null;

    try {
      tx = createTx();
    } catch(err) {
      if (err.message.match(/Insufficient funds/)) {
        ractive.set('sending', false);
        return showInfo({message: 'Please choose lower fee.', title: 'Insufficient funds'});
      }
      return handleTransactionError(err);
    }

    wallet.sendTx(tx, function (err, historyTx) {
      if (err) return handleTransactionError(err);

      ractive.set('confirmation', false);
      ractive.set('success', true);
      ractive.set('onDismiss', data.onSuccessDismiss);

      // update balance & tx history
      emitter.emit('wallet-ready');
      if (historyTx) {
        emitter.emit('append-transactions', [parseHistoryTx(historyTx)]);
      }
    });
  });

  function createTx() {
    var wallet = getWallet();
    var tx;
    var fee = toAtom(ractive.get('fee'));
    if (data.importTxOptions) {
      data.importTxOptions.fee = fee;
      tx = wallet.createImportTx(data.importTxOptions);
    } else {
      tx = wallet.createTx(data.to, toAtom(data.amount), fee);
    }
    return tx;
  }

  function handleTransactionError(err) {
    console.error(err);
    ractive.set('confirmation', false)
    ractive.set('error', err.message)
  }

  return ractive
}

function extendData(data) {

  var network = getTokenNetwork();

  data.confirmation = true;
  data.feeSign = data.importTxOptions ? '-' : '+';
  data.isBitcoin = network === 'bitcoin' || network === 'testnet';

  var wallet = getWallet();
  var feeRates = null;
  var fees = null;
  var unspents = data.importTxOptions ? data.importTxOptions.unspents : null;

  if (data.isBitcoin) {
    var defaultFeePerKb = data.dynamicFees.minimum * 1000 || bitcoin.networks['bitcoin'].feePerKb;

    feeRates = [
      defaultFeePerKb,
      data.dynamicFees.hour * 1000 || defaultFeePerKb,
      data.dynamicFees.fastest * 1000 || defaultFeePerKb
    ];
    fees = wallet.estimateFees(data.to, toAtom(data.amount), feeRates, unspents);

    data.feeMinimum = toUnitString(fees[0]);
    data.feeHour = toUnitString(fees[1]);
    data.feeFastest = toUnitString(fees[2]);
    data.fee = data.feeHour;

    data.onFocus = function() {
      this.find('.js-fee-dropdown').selectedIndex = 1; // fix issue when values are the same
    }

  } else if (network === 'bitcoincash') {
    feeRates = [data.dynamicFees.minimum * 1000 || bitcoin.networks['bitcoincash'].feePerKb];
    fees = wallet.estimateFees(data.to, toAtom(data.amount), feeRates, unspents);
    data.fee = toUnitString(fees[0]);

  } else if (network === 'litecoin') {
    feeRates = [data.dynamicFees.minimum * 1000 || bitcoin.networks['litecoin'].feePerKb];
    fees = wallet.estimateFees(data.to, toAtom(data.amount), feeRates, unspents);
    data.fee = toUnitString(fees[0]);
  }

  return data;
}

module.exports = open
