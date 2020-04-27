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
    setTimeout(function() {
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
        emitter.emit('tx-sent');
      });
    }, 200);
  });

  function createTx() {
    var wallet = getWallet();
    var tx;
    if (data.importTxOptions) {
      tx = wallet.createImportTx(data.importTxOptions);
    } else {
      tx = data.tx;
    }
    return tx;
  }

  function handleTransactionError(err) {
    ractive.set('confirmation', false)
    var wallet = getWallet();
    var hasResponseData = err.response && err.response.data;

    if (err.message === 'cs-node-error') {
      err.message = 'Network node error. Please try again later.'
      ractive.set('interpolations', { network: 'Ripple' })
    } else if (hasResponseData && err.response.data.resultCode === 'tecNO_DST_INSUF_XRP') {
      err.message = "Recipient's wallet isn't activated. You can send only amount greater than :minReserve :denomination.";
      ractive.set('interpolations', {
        minReserve: wallet.minReserve,
        denomination: wallet.denomination
      });
    } else {
      console.error(err);
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
