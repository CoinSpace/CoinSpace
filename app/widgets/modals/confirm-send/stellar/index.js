'use strict';

var Ractive = require('widgets/modals/base');
var emitter = require('lib/emitter');
var getWallet = require('lib/wallet').getWallet;
var toAtom = require('lib/convert').toAtom;
var showInfo = require('widgets/modals/flash').showInfo;

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
      ractive.set('sending', false);
      if (/Insufficient funds/.test(err.message)) return showInfo({title: 'Insufficient funds'});
      if (data.importTxOptions && /Less than minimum reserve/.test(err.message)) {
        return showInfo({
          title: 'Insufficient funds',
          message: "Your wallet isn't activated. You can receive only amount greater than :minReserve :denomination.",
          interpolations: {minReserve: wallet.minReserve, denomination: wallet.denomination}
        });
      }
      return handleTransactionError(err);
    }

    wallet.sendTx(tx, function(err) {
      if (err) return handleTransactionError(err);

      ractive.set('confirmation', false);
      ractive.set('success', true);
      ractive.set('onDismiss', data.onSuccessDismiss);

      // update balance & tx history
      emitter.emit('wallet-ready');
    });
  });

  function createTx() {
    var wallet = getWallet();
    var tx;
    if (data.importTxOptions) {
      tx = wallet.createImportTx(data.importTxOptions);
    } else {
      tx = wallet.createTx(data.to, toAtom(data.amount), data.memo, !data.destinationInfo.isActive)
    }

    return tx;
  }

  function handleTransactionError(err) {
    console.error(err);
    ractive.set('confirmation', false)
    if (err.message === 'cs-node-error') {
      err.message = 'Network node error. Please try again later.'
      ractive.set('interpolations', { network: 'Stellar' })
    }
    ractive.set('error', err.message)
  }

  return ractive
}

function extendData(data) {

  data.confirmation = true;
  data.feeSign = data.importTxOptions ? '-' : '+';

  var wallet = getWallet();
  data.fee = wallet.getDefaultFee();

  return data;
}

module.exports = open
