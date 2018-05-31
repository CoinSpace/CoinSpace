'use strict';

var toAtom = require('lib/convert').toAtom
var toUnitString = require('lib/convert').toUnitString

function validateSend(options, callback) {
  var amount = toAtom(options.amount);
  var wallet = options.wallet;
  var dynamicFees = options.dynamicFees;
  var to = options.to;
  var tx = null;
  var fee;
  var message;

  try {
    if (['bitcoin', 'bitcoincash', 'litecoin', 'testnet'].indexOf(wallet.networkName) !== -1) {
      fee = wallet.estimateFees(to, amount, [dynamicFees.minimum * 1000])[0];
      tx = wallet.createTx(to, amount, fee);
    } else if (wallet.networkName === 'ethereum') {
      tx = wallet.createTx(to, amount);
    } else if (wallet.networkName === 'ripple') {
      tx = wallet.createTx(to, amount, options.tag, options.invoiceId)
    }
  } catch(e) {
    var error;
    if (/Invalid address/.test(e.message)) {
      return callback(new Error('Please enter a valid address to send to'))
    } else if (/Invalid tag/.test(e.message)) {
      return callback(new Error('Please enter a valid destination tag'))
    } else if (/Invalid invoiceID/.test(e.message)) {
      return callback(new Error('Please enter a valid invoice ID'))
    } else if (/Inactive ripple account/.test(e.message)) {
      error = new Error('Your wallet isn\'t activated. To activate it please send greater than minimum reserve (%(minReserve)s XRP) to you wallet address.');
      error.interpolations = { minReserve: wallet.minReserve }
      return callback(error)
    } else if (/Destination address equal source address/.test(e.message)) {
      return callback(new Error('Please enter an address other than your wallet address'))
    } else if (/Invalid value/.test(e.message)) {
      error = new Error('Please enter an amount above')
      error.interpolations = { dust: toUnitString(e.dustThreshold) }
      return callback(error)
    } else if (/Invalid gasLimit/.test(e.message)) {
      return callback(new Error('Please enter Gas Limit greater than zero'))
    } else if (/Insufficient funds/.test(e.message)) {
      if (/Additional funds confirmation pending/.test(e.details)) {
        error = new Error('Some funds are temporarily unavailable. To send this transaction, you will need to wait for your pending transactions to be confirmed first.')
        return callback(error)
      } else if (/Attempt to empty wallet/.test(e.details) && wallet.networkName === 'ethereum') {
        message = [
          'It seems like you are trying to empty your wallet',
          'Taking transaction fee into account, we estimated that the max amount you can send is',
          'We have amended the value in the amount field for you'
        ].join('. ')
        error = new Error(message)
        error.interpolations = { sendableBalance: toUnitString(e.sendableBalance) }
        return callback(error)
      } else if (/Attempt to empty wallet/.test(e.details) && wallet.networkName === 'ripple') {
        message = [
          'It seems like you are trying to empty your wallet',
          'Taking transaction fee and minimum reserve into account, we estimated that the max amount you can send is',
          'We have amended the value in the amount field for you'
        ].join('. ')
        error = new Error(message)
        error.interpolations = { sendableBalance: toUnitString(e.sendableBalance), minReserve: wallet.minReserve }
        return callback(error)
      } else {
        return callback(new Error('You do not have enough funds in your wallet (incl. fee)'))
      }
    } else if (/Insufficient ethereum funds for token transaction/.test(e.message)) {
      error = new Error('You do not have enough Ethereum funds to pay transaction fee (:ethereumRequired ETH).');
      error.interpolations = { ethereumRequired: toUnitString(e.ethereumRequired) };
      return callback(error);
    }

    return callback(e);
  }

  callback(null)
}

module.exports = validateSend
