'use strict';

var Ractive = require('cs-modal')
var emitter = require('cs-emitter')
var getWallet = require('cs-wallet-js').getWallet
var parseTx = require('cs-wallet-js').parseTx
var btcToSatoshi = require('cs-convert').btcToSatoshi
var openSupportModal = require('cs-modal-support')

function open(data){

  data.confirmation = true

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
    var value = btcToSatoshi(ractive.get('amount'))
    var wallet = getWallet()
    var tx = null

    try {
      tx = wallet.createTx(to, value)
    } catch(err) {
      return handleTransactionError()
    }

    wallet.sendTx(tx, function (err){
      if(err) return handleTransactionError(err);

      ractive.set('confirmation', false)
      ractive.set('success', true)

      // update balance & tx history
      emitter.emit('wallet-ready')
      emitter.emit('transactions-loaded', [parseTx(wallet, tx)])
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
