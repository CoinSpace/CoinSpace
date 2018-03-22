'use strict';

var toAtom = require('lib/convert').toAtom
var toUnitString = require('lib/convert').toUnitString

function validateSend(wallet, to, unitValue, dynamicFees, callback) {
  var amount = toAtom(unitValue)
  var tx = null
  var fee;

  try {
    if (['bitcoin', 'bitcoincash', 'litecoin', 'testnet'].indexOf(wallet.networkName) !== -1) {
      fee = wallet.estimateFees(to, amount, [dynamicFees.minimum * 1000])[0];
    }
    tx = wallet.createTx(to, amount, fee)
  } catch(e) {
    var error;
    if (e.message.match(/Invalid address/)) {
      return callback(new Error('Please enter a valid address to send to'))
    } else if (e.message.match(/Invalid value/)) {
      error = new Error('Please enter an amount above')
      error.interpolations = { dust: toUnitString(e.dustThreshold) }
      return callback(error)
    } else if (e.message.match(/Invalid gasLimit/)) {
      return callback(new Error('Please enter Gas Limit greater than zero'))
    } else if (e.message.match(/Insufficient funds/)) {
      if (e.details && e.details.match(/Additional funds confirmation pending/)) {
        error = new Error('Some funds are temporarily unavailable. To send this transaction, you will need to wait for your pending transactions to be confirmed first.')
        return callback(error)
      } else if (e.details && e.details.match(/Attempt to empty wallet/) && wallet.networkName === 'ethereum') {
        var message = [
          'It seems like you are trying to empty your wallet',
          'Taking transaction fee into account, we estimated that the max amount you can send is',
          'We have amended the value in the amount field for you'
        ].join('. ')
        error = new Error(message)
        error.interpolations = { sendableBalance: toUnitString(e.sendableBalance) }
        return callback(error)
      } else {
        return callback(new Error('You do not have enough funds in your wallet (incl. fee)'))
      }
    }

    return callback(e);
  }

  callback(null)
}

module.exports = validateSend
