'use strict';

var work = require('webworkify')
var worker = window.isIE ? require('./ie-worker.js') : work(require('./worker.js'))
var auth = require('./auth')
var db = require('./db')
var emitter = require('cs-emitter')
var crypto = require('crypto')
var AES = require('cs-aes')
var denominations = require('cs-denomination')
var Wallet = require('cs-wallet')
var validateSend = require('./validator')
var rng = require('secure-random').randomBuffer
var bitcoin = require('bitcoinjs-lib')
var xhr = require('cs-xhr')
var cache = require('memory-cache')

var wallet = null
var seed = null
var mnemonic = null
var id = null
var availableTouchId = false

var uriRoot = window.location.origin
if(window.buildType === 'phonegap') {
  uriRoot = process.env.PHONEGAP_URL
}

function createWallet(passphrase, network, callback) {
  var message = passphrase ? 'Decoding seed phrase' : 'Generating'
  emitter.emit('wallet-opening', message)

  var data = {passphrase: passphrase}
  if(!passphrase){
   data.entropy = rng(128 / 8).toString('hex')
  }

  worker.addEventListener('message', function(e) {
    assignSeedAndId(e.data.seed)

    mnemonic = e.data.mnemonic
    auth.exist(id, function(err, userExists){
      if(err) return callback(err);

      callback(null, {userExists: userExists, mnemonic: mnemonic})
    })
  }, false)

  worker.addEventListener('error', function(e) {
    return callback({message: e.message.replace("Uncaught Error: ", '')})
  })

  worker.postMessage(data)
}

function callbackError(err, callbacks) {
  callbacks.forEach(function (fn) {
    if (fn != null) fn(err)
  })
}

function setPin(pin, network, done, unspentsDone, balanceDone) {
  var callbacks = [done, unspentsDone, balanceDone]
  auth.register(id, pin, function(err, token){
    if(err) return callbackError(err.error, callbacks);

    emitter.emit('wallet-auth', {token: token, pin: pin})

    savePin(pin)

    var encrypted = AES.encrypt(seed, token)
    db.saveEncrypedSeed(id, encrypted, function(err){
      if(err) return callbackError(err.error, callbacks);

      var accounts = getAccountsFromSeed(network)
      initWallet(accounts.externalAccount, accounts.internalAccount, network,
                 done, unspentsDone, balanceDone)
    })
  })
}

function disablePin(pin, callback) {
  auth.disablePin(id, pin, callback)
}

function openWalletWithPin(pin, network, done, unspentsDone, balanceDone) {
  var callbacks = [done, unspentsDone, balanceDone]
  db.getCredentials(function(err, credentials){
    if(err) return callbackError(err, callbacks);

    var id = credentials.id
    var encryptedSeed = credentials.seed
    auth.login(id, pin, function(err, token){
      if(err){
        if(err.error === 'user_deleted') {
          return db.deleteCredentials(credentials, function(){
            callbackError(err.error, callbacks);
          })
        }
        return callbackError(err.error, callbacks);
      }

      savePin(pin)

      assignSeedAndId(AES.decrypt(encryptedSeed, token))
      emitter.emit('wallet-auth', {token: token, pin: pin})

      var accounts = getAccountsFromSeed(network)
      initWallet(accounts.externalAccount, accounts.internalAccount, network,
                 done, unspentsDone, balanceDone)
    })
  })
}

function savePin(pin){
    if(availableTouchId) window.localStorage.setItem('_pin_cs', AES.encrypt(pin, 'pinCoinSpace'))
}

function setAvailableTouchId(){
    availableTouchId = true
}

function getPin(){
    var pin = window.localStorage.getItem('_pin_cs')
    return pin ? AES.decrypt(pin, 'pinCoinSpace') : null
}

function resetPin(){
    window.localStorage.removeItem('_pin_cs')
}

function assignSeedAndId(s) {
  seed = s
  id = crypto.createHash('sha256').update(seed).digest('hex')
  emitter.emit('wallet-init', {seed: seed, id: id})
}

function getAccountsFromSeed(networkName, done) {
  emitter.emit('wallet-opening', 'Synchronizing Wallet')

  var network = bitcoin.networks[networkName]
  var accountZero = bitcoin.HDNode.fromSeedHex(seed, network).deriveHardened(0)

  return {
    externalAccount: accountZero.derive(0),
    internalAccount: accountZero.derive(1)
  }
}

function initWallet(externalAccount, internalAccount, networkName, done, unspentsDone, balanceDone){
  var network = bitcoin.networks[networkName]

  wallet = new Wallet(externalAccount, internalAccount, networkName, function(err, w) {
    if(err) return done(err)

    var txObjs = wallet.getTransactionHistory()
    done(null, txObjs.map(function(tx) {
      return parseTx(wallet, tx)
    }))
  }, unspentsDone, balanceDone)

  wallet.denomination = denominations[networkName].default
}

function parseTx(wallet, tx) {
  var id = tx.getId()
  var metadata = wallet.txMetadata[id]
  var network = bitcoin.networks[wallet.networkName]

  var timestamp = metadata.timestamp
  timestamp = timestamp ? timestamp * 1000 : new Date().getTime()

  var node = wallet.txGraph.findNodeById(id)
  var prevOutputs = node.prevNodes.reduce(function(inputs, n) {
    inputs[n.id] = n.tx.outs
    return inputs
  }, {})

  var inputs = tx.ins.map(function(input) {
    var buffer = new Buffer(input.hash)
    Array.prototype.reverse.call(buffer)
    var inputTxId = buffer.toString('hex')

    return prevOutputs[inputTxId][input.index]
  })

  return {
    id: id,
    amount: metadata.value,
    timestamp: timestamp,
    confirmations: metadata.confirmations,
    fee: metadata.fee,
    ins: parseOutputs(inputs, network),
    outs: parseOutputs(tx.outs, network)
  }

  function parseOutputs(outputs, network) {
    return outputs.map(function(output){
      return {
        address: bitcoin.Address.fromOutputScript(output.script, network).toString(),
        amount: output.value
      }
    })
  }
}

function sync(done) {
  initWallet(wallet.externalAccount, wallet.internalAccount, wallet.networkName, done)
}

function getWallet(){
  return wallet
}

function walletExists(callback) {
  db.getCredentials(function(err, doc){
    if(doc) return callback(true);
    return callback(false)
  })
}

function reset(callback){
  db.getCredentials(function(err, credentials){
    if(err) return callback(err);

    db.deleteCredentials(credentials, function(deleteError){
      callback(deleteError)
    })
  })
}

function updateBitcoinFees(callback) {
  var fees = cache.get('bitcoinFees')

  if (fees) {
    bitcoin.networks['bitcoin'].hourFeePerKb = fees.hour * 1000
    bitcoin.networks['bitcoin'].fastestFeePerKb = fees.fastest * 1000
    bitcoin.networks['bitcoin'].feePerKb = bitcoin.networks['bitcoin'].hourFeePerKb
    return callback()
  }

  xhr({
    uri: uriRoot + '/fees',
    method: 'GET'
  }, function(err, resp, body){
    if(resp.statusCode !== 200) {
      console.error(body)
      return callback()
    }
    var data = JSON.parse(body)
    bitcoin.networks['bitcoin'].hourFeePerKb = data.hour * 1000
    bitcoin.networks['bitcoin'].fastestFeePerKb = data.fastest * 1000
    bitcoin.networks['bitcoin'].feePerKb = bitcoin.networks['bitcoin'].hourFeePerKb
    cache.put('bitcoinFees', {hour: data.hour, fastest: data.fastest}, 10 * 60 * 1000)
    callback()
  })
}

module.exports = {
  openWalletWithPin: openWalletWithPin,
  createWallet: createWallet,
  setPin: setPin,
  disablePin: disablePin,
  getWallet: getWallet,
  walletExists: walletExists,
  reset: reset,
  sync: sync,
  validateSend: validateSend,
  parseTx: parseTx,
  getPin: getPin,
  resetPin: resetPin,
  setAvailableTouchId: setAvailableTouchId,
  updateBitcoinFees: updateBitcoinFees
}
