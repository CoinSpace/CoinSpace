'use strict';

var Ractive = require('cs-modal')
var emitter = require('cs-emitter')
var getWallet = require('cs-wallet-js').getWallet
var parseHistoryTx = require('cs-wallet-js').parseHistoryTx
var toAtom = require('cs-convert').toAtom
var toUnitString = require('cs-convert').toUnitString
var openSupportModal = require('cs-modal-support')
var bitcoin = require('bitcoinjs-lib')
var showInfo = require('cs-modal-flash').showInfo
var getNetwork = require('cs-network')

function open(data){

  data.confirmation = true

  data.isEthereum = getNetwork() === 'ethereum';
  data.isBitcoin = getNetwork() === 'bitcoin' || getNetwork() === 'testnet';
  data.isLitecoin = getNetwork() === 'litecoin';

  var wallet = getWallet()
  var feeRates = null
  var fees = null

  if (data.isBitcoin) {
    var defaultFeePerKb = bitcoin.networks['bitcoin'].feePerKb

    feeRates = [
      defaultFeePerKb,
      data.dynamicFees.hourFeePerKb ? data.dynamicFees.hourFeePerKb : defaultFeePerKb,
      data.dynamicFees.fastestFeePerKb ? data.dynamicFees.fastestFeePerKb : defaultFeePerKb
    ];
    fees = wallet.estimateFees(data.to, toAtom(data.amount), feeRates)

    data.feeMinimum = toUnitString(fees[0])
    data.feeHour = toUnitString(fees[1])
    data.feeFastest = toUnitString(fees[2])
    data.fee = data.feeHour

  } else if (data.isLitecoin) {
    feeRates = [bitcoin.networks['litecoin'].feePerKb]
    fees = wallet.estimateFees(data.to, toAtom(data.amount), feeRates)
    data.fee = toUnitString(fees[0])

  } else if (data.isEthereum) {
    data.fee = toUnitString(wallet.getDefaultFee())
  }

  var ractive = new Ractive({
    partials: {
      content: require('./_content.ract').template
    },
    data: data
  })

  emitter.emit('send-confirm-open')

  ractive.on('clear', function() {
    ractive.fire('cancel')
    emitter.emit('clear-send-form')
  })

  ractive.on('send', function(){
    ractive.set('sending', true)
    var to = ractive.get('to')
    var fee = toAtom(ractive.get('fee'))
    var value = toAtom(ractive.get('amount'))
    var wallet = getWallet()
    var tx = null

    try {
      tx = wallet.createTx(to, value, fee)
    } catch(err) {
      if (err.message.match(/Insufficient funds/)) {
        ractive.set('sending', false)
        return showInfo({message: 'Please choose lower fee.'})
      }
      return handleTransactionError()
    }

    wallet.sendTx(tx, function (err, historyTx){
      if(err) return handleTransactionError(err);

      ractive.set('confirmation', false)
      ractive.set('success', true)

      // update balance & tx history
      emitter.emit('wallet-ready')
      emitter.emit('append-transactions', [parseHistoryTx(historyTx)])
    })
  })

  ractive.on('open-support', function(){
    ractive.fire('cancel')
    var message = ractive.data.translate("Please describe what happened above. Below are network error logs that could help us identify your issue.")
    openSupportModal({description: "\n----\n" + message + "\n\n" + ractive.get('error')})
  })


  function handleTransactionError(err) {
    ractive.set('confirmation', false)
    ractive.set('error', err.message)
  }

  return ractive
}

module.exports = open
