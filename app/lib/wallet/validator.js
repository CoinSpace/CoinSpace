'use strict';

var networks = require('bitcoinjs-lib').networks
var btcToSatoshi = require('cs-convert').btcToSatoshi
var satoshiToBtc = require('cs-convert').satoshiToBtc

function validateSend(wallet, to, btcValue, callback){
  var amount = btcToSatoshi(btcValue)
  var network = networks[wallet.networkName]
  var tx = null

  try {
    tx = wallet.createTx(to, amount)
  } catch(e) {
    if(e.message.match(/Invalid address/)) {
      return callback(new Error('Please enter a valid address to send to'))
    } else if(e.message.match(/Invalid value/)) {
      var error = new Error('Please enter an amount above')
      error.interpolations = { dust: satoshiToBtc(e.dustThreshold) }
      return new callback(error)
    } else if(e.message.match(/Insufficient funds/)) {
      var error

      if(e.details && e.details.match(/Additional funds confirmation pending/)){
        error = new Error("Some funds are temporarily unavailable. To send this transaction, you will need to wait for your pending transactions to be confirmed first (this should not take more than a few minutes).")
        return callback(error)
      } else if(attemptToEmptyWallet(wallet.getBalance(), amount, network)){
        var message = [
          "It seems like you are trying to empty your wallet",
          "Taking transaction fee into account, we estimated that the max amount you can send is",
          "We have amended the value in the amount field for you"
        ].join('. ')
        error = new Error(message)

        var sendableBalance = satoshiToBtc(amount - (e.needed - e.has))
        error.interpolations = { sendableBalance: sendableBalance }

        return new callback(error)
      } else {
        return callback(new Error("You do not have enough funds in your wallet"))
      }
    }

    return new callback(e)
  }

  callback(null, satoshiToBtc(wallet.txGraph.calculateFee(tx)))

}

function attemptToEmptyWallet(balance, amount, network){
  return balance - network.feePerKb < amount && amount <= balance
}

module.exports = validateSend
