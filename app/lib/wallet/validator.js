'use strict';

var toAtom = require('lib/convert').toAtom
var toUnitString = require('lib/convert').toUnitString

function validateSend(wallet, to, unitValue, callback){
  var amount = toAtom(unitValue)
  var tx = null

  try {
    tx = wallet.createTx(to, amount)
  } catch(e) {
    if(e.message.match(/Invalid address/)) {
      return callback(new Error('Please enter a valid address to send to'))
    } else if(e.message.match(/Invalid value/)) {
      var error = new Error('Please enter an amount above')
      error.interpolations = { dust: toUnitString(e.dustThreshold) }
      return new callback(error)
    } else if(e.message.match(/Insufficient funds/)) {
      var error

      if(e.details && e.details.match(/Additional funds confirmation pending/)){
        error = new Error("Some funds are temporarily unavailable. To send this transaction, you will need to wait for your pending transactions to be confirmed first.")
        return callback(error)
      } else if(e.details && e.details.match(/Attempt to empty wallet/)){
        var message = [
          "It seems like you are trying to empty your wallet",
          "Taking transaction fee into account, we estimated that the max amount you can send is",
          "We have amended the value in the amount field for you"
        ].join('. ')
        error = new Error(message)
        error.interpolations = { sendableBalance: toUnitString(e.sendableBalance) }

        return new callback(error)
      } else {
        return callback(new Error("You do not have enough funds in your wallet"))
      }
    }

    return new callback(e)
  }

  callback(null)
}

module.exports = validateSend
