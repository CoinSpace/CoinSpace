'use strict';

var Worker = require('worker-loader?inline&fallback=false!./worker.js');
var worker = new Worker()

var auth = require('./auth')
var utils = require('./utils')
var walletDb = require('./db')
var emitter = require('lib/emitter')
var crypto = require('crypto')
var AES = require('lib/aes')
var denomination = require('lib/denomination')
var CsWallet = require('cs-wallet')
var validateSend = require('./validator')
var rng = require('secure-random').randomBuffer
var bitcoin = CsWallet.bitcoin
var request = require('lib/request')
var cache = require('memory-cache')
var EthereumWallet = require('cs-ethereum-wallet');
var convert = require('lib/convert');
var getToken = require('lib/token').getToken;
var setToken = require('lib/token').setToken;
var db = require('lib/db');
var _ = require('lodash');
var HDKey = require('hdkey');
var Buffer = require('safe-buffer').Buffer;

var wallet = null
var seed = null
var mnemonic = null
var id = null
var availableTouchId = false

var Wallet = {
  bitcoin: CsWallet,
  bitcoincash: CsWallet,
  litecoin: CsWallet,
  testnet: CsWallet,
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
  auth.register(id, pin, function(err, token) {
    if (err) return callbackError(err, callbacks);

    savePin(pin);
    walletDb.saveEncrypedSeed(id, AES.encrypt(seed, token));

    emitter.emit('wallet-opening', 'Synchronizing Wallet');
    emitter.emit('db-init');

    emitter.once('db-ready', function(err) {
      if (err) return callbackError(err, callbacks);
      initWallet(network, done, txSyncDone);
    });
  })
}

function removeAccount(callback) {
  auth.remove(id, callback);
}

function setUsername(username, callback) {
  auth.setUsername(id, username, callback);
}

function openWalletWithPin(pin, network, done, txSyncDone) {
  var callbacks = [done, txSyncDone]
  var credentials = walletDb.getCredentials();
  var id = credentials.id
  var encryptedSeed = credentials.seed
  auth.login(id, pin, function(err, token) {
    if (err) {
      if (err.message === 'user_deleted') {
        walletDb.deleteCredentials();
      }
      return callbackError(err, callbacks);
    }

    savePin(pin)
    assignSeedAndId(AES.decrypt(encryptedSeed, token));

    emitter.emit('wallet-opening', 'Synchronizing Wallet');
    emitter.emit('db-init');

    emitter.once('db-ready', function(err) {
      if (err) return callbackError(err, callbacks);
      initWallet(network, done, txSyncDone);
    });
  })
}

function savePin(pin){
    if (availableTouchId) window.localStorage.setItem('_pin_cs', AES.encrypt(pin, 'pinCoinSpace'));
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
  var token = getToken();
  if (!isValidWalletToken(token)) {
    setToken(networkName);
    token = false;
  }

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
    options.token = token;
    convert.setDecimals(token ? token.decimals : 18);
  } else if (['bitcoin', 'bitcoincash', 'litecoin', 'testnet'].indexOf(networkName) !== -1) {
    var accounts = getDerivedAccounts(networkName);
    options.externalAccount = accounts.externalAccount;
    options.internalAccount = accounts.internalAccount;
    options.minConf = 4;
    convert.setDecimals(8);
  }

  wallet = new Wallet[networkName](options);
  wallet.denomination = token ? denomination(token) : denomination(networkName);
}

function isValidWalletToken(token) {
  var walletTokens = db.get('walletTokens') || [];
  var isFound = _.find(walletTokens, function(item) {
    return _.isEqual(token, item);
  });
  return !!isFound;
}

function getDerivedAccounts(networkName) {
  if (wallet && wallet.networkName === networkName && wallet.externalAccount && wallet.internalAccount) {
    return {
      externalAccount: wallet.externalAccount,
      internalAccount: wallet.internalAccount
    }
  }
  var network = bitcoin.networks[networkName]
  var accountZero = HDKey.fromMasterSeed(new Buffer(seed, 'hex'), network.bip32).deriveChild(HDKey.HARDENED_OFFSET)
  return {
    externalAccount: accountZero.deriveChild(0),
    internalAccount: accountZero.deriveChild(1)
  }
}

function parseHistoryTx(tx) {
  var networkName = wallet.networkName
  if (networkName === 'ethereum') {
    return utils.parseEthereumTx(tx)
  } else if (['bitcoin', 'bitcoincash', 'litecoin', 'testnet'].indexOf(networkName) !== -1) {
    return utils.parseBtcLtcTx(tx)
  }
}

function sync(done, txDone) {
  initWallet(wallet.networkName, done, txDone)
}

function getWallet() {
  return wallet;
}

function getId() {
  return id;
}

function walletExists() {
  return !!walletDb.getCredentials();
}

function reset() {
  walletDb.deleteCredentials();
}

function getDynamicFees(callback) {
  if (wallet.networkName === 'ethereum') return callback();
  var fees = cache.get('fees')

  if (fees) {
    return callback(fees)
  }

  request({
    url: urlRoot + 'fees',
    params: {
      network: wallet.networkName
    },
  }, function(err, data) {
    if (err) return callback({});
    cache.put('fees', data, 10 * 60 * 1000)
    callback(data)
  });
}

module.exports = {
  openWalletWithPin: openWalletWithPin,
  createWallet: createWallet,
  setPin: setPin,
  removeAccount: removeAccount,
  setUsername: setUsername,
  getWallet: getWallet,
  getId: getId,
  walletExists: walletExists,
  reset: reset,
  sync: sync,
  initWallet: initWallet,
  validateSend: validateSend,
  parseHistoryTx: parseHistoryTx,
  getPin: getPin,
  resetPin: resetPin,
  setAvailableTouchId: setAvailableTouchId,
  getDynamicFees: getDynamicFees
}
