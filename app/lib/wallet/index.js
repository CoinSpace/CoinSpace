'use strict';

var Worker = require('worker-loader?inline&fallback=false!./worker.js');
var worker = new Worker()

var auth = require('./auth')
var utils = require('./utils')
var db = require('./db')
var emitter = require('lib/emitter')
var crypto = require('crypto')
var AES = require('lib/aes')
var denominations = require('lib/denomination')
var BtcLtcWallet = require('cs-wallet')
var validateSend = require('./validator')
var rng = require('secure-random').randomBuffer
var bitcoin = require('bitcoinjs-lib')
var request = require('lib/request')
var cache = require('memory-cache')
var EthereumWallet = require('cs-ethereum-wallet');

var wallet = null
var seed = null
var mnemonic = null
var id = null
var availableTouchId = false

var Wallet = {
  bitcoin: BtcLtcWallet,
  litecoin: BtcLtcWallet,
  testnet: BtcLtcWallet,
  ethereum: EthereumWallet
}

var urlRoot = process.env.SITE_URL

function createWallet(passphrase, network, callback) {
  var message = passphrase ? 'Decoding seed phrase' : 'Generating'
  emitter.emit('wallet-opening', message)

  var data = {passphrase: passphrase}
  if(!passphrase){
   data.entropy = rng(128 / 8).toString('hex')
  }

  worker.onmessage = function(e) {
    assignSeedAndId(e.data.seed)

    mnemonic = e.data.mnemonic
    auth.exist(id, function(err, userExists){
      if(err) return callback(err);

      callback(null, {userExists: userExists, mnemonic: mnemonic})
    })
  }

  worker.onerror = function(e) {
    return callback({message: e.message.replace("Uncaught Error: ", '')})
  }

  worker.postMessage(data)
}

function callbackError(err, callbacks) {
  callbacks.forEach(function (callback) {
    if (!callback) return;
    return callback(err);
  });
}

function setPin(pin, network, done, txSyncDone) {
  var callbacks = [done, txSyncDone]
  auth.register(id, pin, function(err, token){
    if(err) return callbackError(err, callbacks);

    emitter.emit('wallet-auth', {token: token, pin: pin})

    savePin(pin)

    var encrypted = AES.encrypt(seed, token)
    db.saveEncrypedSeed(id, encrypted, function(err){
      if(err) return callbackError(err, callbacks);

      emitter.emit('wallet-opening', 'Synchronizing Wallet')
      initWallet(network, done, txSyncDone)
    })
  })
}

function disablePin(pin, callback) {
  auth.disablePin(id, pin, callback)
}

function openWalletWithPin(pin, network, done, txSyncDone) {
  var callbacks = [done, txSyncDone]
  db.getCredentials(function(err, credentials){
    if(err) return callbackError(err, callbacks);

    var id = credentials.id
    var encryptedSeed = credentials.seed
    auth.login(id, pin, function(err, token){
      if (err) {
        if (err.message === 'user_deleted') {
          return db.deleteCredentials(credentials, function(){
            callbackError(err, callbacks);
          })
        }
        return callbackError(err, callbacks);
      }

      savePin(pin)

      assignSeedAndId(AES.decrypt(encryptedSeed, token))
      emitter.emit('wallet-auth', {token: token, pin: pin})
      emitter.emit('wallet-opening', 'Synchronizing Wallet')

      initWallet(network, done, txSyncDone)
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

function initWallet(networkName, done, txDone) {
  var options = {
    networkName: networkName,
    done: done,
    txDone: function(err) {
      if(err) return txDone(err)
      var txObjs = wallet.getTransactionHistory()
      txDone(null, txObjs.map(function(tx) {
        return parseHistoryTx(tx)
      }))
    }
  }

  if (networkName === 'ethereum') {
    options.seed = seed;
    options.minConf = 12;
  } else if (networkName === 'bitcoin' || networkName === 'litecoin' || networkName === 'testnet') {
    var accounts = getDerivedAccounts(networkName)
    options.externalAccount = accounts.externalAccount
    options.internalAccount = accounts.internalAccount
  }

  wallet = new Wallet[networkName](options)
  wallet.denomination = denominations[networkName].default
}

function getDerivedAccounts(networkName) {
  if (wallet && wallet.externalAccount && wallet.internalAccount) {
    return {
      externalAccount: wallet.externalAccount,
      internalAccount: wallet.internalAccount
    }
  }
  var network = bitcoin.networks[networkName]
  var accountZero = bitcoin.HDNode.fromSeedHex(seed, network).deriveHardened(0)
  return {
    externalAccount: accountZero.derive(0),
    internalAccount: accountZero.derive(1)
  }
}

function parseHistoryTx(tx) {
  var networkName = wallet.networkName
  if (networkName === 'ethereum') {
    return utils.parseEthereumTx(tx)
  } else if (networkName === 'bitcoin' || networkName === 'litecoin' || networkName === 'testnet') {
    return utils.parseBtcLtcTx(tx)
  }
}

function sync(done, txDone) {
  initWallet(wallet.networkName, done, txDone)
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

function getDynamicFees(callback) {
  var fees = cache.get('bitcoinFees')

  if (fees) {
    return callback({hourFeePerKb: fees.hour * 1000, fastestFeePerKb: fees.fastest * 1000})
  }

  request({
    url: urlRoot + '/fees'
  }, function(err, data) {
    if (err) return callback({});
    cache.put('bitcoinFees', {hour: data.hour, fastest: data.fastest}, 10 * 60 * 1000)
    callback({hourFeePerKb: data.hour * 1000, fastestFeePerKb: data.fastest * 1000})
  });
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
  parseHistoryTx: parseHistoryTx,
  getPin: getPin,
  resetPin: resetPin,
  setAvailableTouchId: setAvailableTouchId,
  getDynamicFees: getDynamicFees
}
