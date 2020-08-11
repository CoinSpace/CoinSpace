'use strict';

const Worker = require('worker-loader?inline&fallback=false!./worker.js');
const worker = new Worker();

const auth = require('./auth');
const utils = require('./utils');
const walletDb = require('./db');
const emitter = require('lib/emitter');
const crypto = require('crypto');
const AES = require('lib/aes');
const denomination = require('lib/denomination');
const CsWallet = require('cs-wallet');
const validateSend = require('./validator');
const rng = require('secure-random').randomBuffer;
const request = require('lib/request');
const EthereumWallet = require('cs-ethereum-wallet');
const RippleWallet = require('cs-ripple-wallet');
const StellarWallet = require('cs-stellar-wallet');
const EOSWallet = require('cs-eos-wallet');
const convert = require('lib/convert');
const getToken = require('lib/token').getToken;
const setToken = require('lib/token').setToken;
const db = require('lib/db');
const _ = require('lodash');
const HDKey = require('hdkey');
const Buffer = require('safe-buffer').Buffer;
const bchaddr = require('bchaddrjs');

let wallet = null;
let seed = null;
let mnemonic = null;
let id = null;
let availableTouchId = false;

const Wallet = {
  bitcoin: CsWallet,
  bitcoincash: CsWallet,
  bitcoinsv: CsWallet,
  litecoin: CsWallet,
  ethereum: EthereumWallet,
  ripple: RippleWallet,
  stellar: StellarWallet,
  eos: EOSWallet,
  dogecoin: CsWallet,
  dash: CsWallet,
};

const names = {
  BTC: 'Bitcoin',
  BCH: 'Bitcoin Cash',
  BSV: 'Bitcoin SV',
  LTC: 'Litecoin',
  ETH: 'Ethereum',
  XRP: 'Ripple',
  XLM: 'Stellar',
  EOS: 'EOS',
  DOGE: 'Dogecoin',
  DASH: 'Dash',
  USDT: 'Tether USD',
};

const urlRoot = window.urlRoot;

function createWallet(passphrase, network, callback) {
  const data = { passphrase };
  if (!passphrase) {
    data.entropy = rng(128 / 8).toString('hex');
  }

  worker.onmessage = function(e) {
    assignSeedAndId(e.data.seed);

    mnemonic = e.data.mnemonic;
    auth.exist(id, function(err, userExists) {
      if (err) return callback(err);

      callback(null, { userExists, mnemonic });
    });
  };

  worker.onerror = function(e) {
    e.preventDefault();
    return callback({ message: e.message.split(': ')[1] });
  };

  worker.postMessage(data);
}

function setPin(pin, network, done) {
  auth.register(id, pin, function(err, token) {
    if (err) return done(err);

    savePin(pin);
    walletDb.saveEncrypedSeed(id, AES.encrypt(seed, token));

    emitter.emit('wallet-opening', 'Synchronizing Wallet');
    emitter.emit('db-init');

    emitter.once('db-ready', function(err) {
      if (err) return done(err);
      initWallet(network, done);
    });
  });
}

function removeAccount(callback) {
  auth.remove(id, callback);
}

function setUsername(username, callback) {
  auth.setUsername(id, username, callback);
}

function openWalletWithPin(pin, network, done) {
  const credentials = walletDb.getCredentials();
  const id = credentials.id;
  const encryptedSeed = credentials.seed;
  auth.login(id, pin, function(err, token) {
    if (err) {
      if (err.message === 'user_deleted') {
        walletDb.deleteCredentials();
      }
      return done(err);
    }

    savePin(pin);
    assignSeedAndId(AES.decrypt(encryptedSeed, token));

    emitter.emit('wallet-opening', 'Synchronizing Wallet');
    emitter.emit('db-init');

    emitter.once('db-ready', function(err) {
      if (err) return done(err);
      initWallet(network, done);
    });
  });
}

function savePin(pin) {
  if (availableTouchId) window.localStorage.setItem('_pin_cs', AES.encrypt(pin, 'pinCoinSpace'));
}

function setAvailableTouchId() {
  availableTouchId = true;
}

function getPin() {
  const pin = window.localStorage.getItem('_pin_cs');
  return pin ? AES.decrypt(pin, 'pinCoinSpace') : null;
}

function resetPin() {
  window.localStorage.removeItem('_pin_cs');
}

function assignSeedAndId(_seed) {
  seed = _seed;
  id = crypto.createHash('sha256').update(seed).digest('hex');
  emitter.emit('wallet-init', { seed, id });
}

function initWallet(networkName, done) {
  let token = getToken();
  if (!isValidWalletToken(token)) {
    setToken(networkName);
    token = false;
  }

  const options = {
    networkName,
    done,
  };

  if (networkName === 'ethereum') {
    options.seed = seed;
    options.minConf = 12;
    options.token = token;
    convert.setDecimals(token ? token.decimals : 18);
  } else if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash'].indexOf(networkName) !== -1) {
    options.hdkey = HDKey.fromMasterSeed(new Buffer(seed, 'hex'));
    options.minConf = 3;
    options.addressType = db.get(networkName + '.addressType') || 'p2pkh';
    if (networkName === 'bitcoincash') {
      options.minConf = 0;
    }
    options.getDynamicFees = function() {
      return request({
        url: urlRoot + 'v1/fees',
        params: { network: networkName },
      }).catch(console.error);
    };
    options.getCsFee = function() {
      return request({
        url: urlRoot + 'v1/csFee',
        params: { network: networkName },
      }).catch(console.error);
    };
    convert.setDecimals(8);
  } else if (networkName === 'ripple') {
    options.seed = seed;
    convert.setDecimals(0);
  } else if (networkName === 'stellar') {
    options.seed = seed;
    convert.setDecimals(0);
  } else if (networkName === 'eos') {
    options.seed = seed;
    options.accountName = db.get('eosAccountName') || '';
    if (process.env.NODE_ENV === 'development') {
      options.chainId = 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473';
    }
    convert.setDecimals(0);
  }

  wallet = new Wallet[networkName](options);
  wallet.denomination = token ? denomination(token) : denomination(networkName);
  wallet.name = names[wallet.denomination] || wallet.denomination;
}

function isValidWalletToken(token) {
  if (token && token.isDefault) return true;
  const walletTokens = db.get('walletTokens') || [];
  const isFound = _.find(walletTokens, function(item) {
    return _.isEqual(token, item);
  });
  return !!isFound;
}

function parseHistoryTx(tx) {
  const networkName = wallet.networkName;
  if (networkName === 'ethereum') {
    return utils.parseEthereumTx(tx);
  } else if (networkName === 'ripple') {
    return tx;
  } else if (networkName === 'stellar') {
    return tx;
  } else if (networkName === 'eos') {
    return tx;
  } else if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash'].indexOf(networkName) !== -1) {
    return utils.parseBtcLtcTx(tx, networkName);
  }
}

function sync(done) {
  initWallet(wallet.networkName, done);
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

function getDestinationInfo(to) {
  if (wallet.networkName === 'ripple' || wallet.networkName === 'stellar') {
    return wallet.getDestinationInfo(to);
  } else {
    return Promise.resolve();
  }
}

function setToAlias(data) {
  if (wallet.networkName !== 'bitcoincash') return;
  try {
    const legacy = bchaddr.toLegacyAddress(data.to);
    if (legacy !== data.to) {
      data.alias = data.to;
      data.to = legacy;
    }
  // eslint-disable-next-line
  } catch (e) {}
}

module.exports = {
  openWalletWithPin,
  createWallet,
  setPin,
  removeAccount,
  setUsername,
  getWallet,
  getId,
  walletExists,
  reset,
  sync,
  initWallet,
  validateSend,
  parseHistoryTx,
  getPin,
  resetPin,
  setAvailableTouchId,
  getDestinationInfo,
  setToAlias,
};
