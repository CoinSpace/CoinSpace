'use strict';

const Worker = require('worker-loader?inline&fallback=false!./worker.js');
const worker = new Worker();

const auth = require('./auth');
const utils = require('./utils');
const walletDb = require('./db');
const emitter = require('lib/emitter');
const crypto = require('crypto');
const encryption = require('lib/encryption');
const denomination = require('lib/denomination');
const CsWallet = require('cs-wallet');
const validateSend = require('./validator');
const request = require('lib/request');
const EthereumWallet = require('cs-ethereum-wallet');
const RippleWallet = require('cs-ripple-wallet');
const StellarWallet = require('cs-stellar-wallet');
const EOSWallet = require('cs-eos-wallet');
const convert = require('lib/convert');
const {
  getToken,
  getTokenNetwork,
  setToken,
} = require('lib/token');
const db = require('lib/db');
const _ = require('lodash');
const HDKey = require('hdkey');
const { Buffer } = require('safe-buffer');
const bchaddr = require('bchaddrjs');

const state = {
  wallet: null,
  seed: null,
  id: null,
};

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

const { urlRoot } = window;

function createWallet(passphrase) {
  const data = { passphrase };

  return new Promise((resolve, reject) => {
    worker.onmessage = function(event) {
      walletDb.setKey(event.data.key);
      assignSeedAndId(event.data.seed);
      resolve({ mnemonic: event.data.mnemonic });
    };

    worker.onerror = function(event) {
      event.preventDefault();
      reject(new Error(event.message.split(': ')[1]));
    };

    worker.postMessage(data);
  });
}

function migrateWallet(pin) {
  const key = crypto.randomBytes(32).toString('hex');
  walletDb.setKey(key);

  return registerWallet(pin);
}

function registerWallet(pin) {
  const key = walletDb.getKey();
  const hash = encryption.sha256pin(pin, key);

  return auth.register(state.id, hash)
    .then(({ login, token }) => {
      walletDb.setSeed(state.seed, token);
      walletDb.setLoginJWT(login);
    });
}

async function loginWithPin(pin) {
  const key = walletDb.getKey();
  const hash = encryption.sha256pin(pin, key);

  const { second } = await auth.login(walletDb.getLoginJWT(), hash);

  if (second) {
    console.log('need second factor!');
    // TODO implement
  } else {
    return _openWallet();
  }
}

async function loginWithFido() {
  // TODO implement
}

function _openWallet() {
  return auth.token()
    .then(({ token }) => {
      assignSeedAndId(walletDb.getSeed(token));
    });
}

function removeAccount() {
  return auth.remove(state.id);
}

function setUsername(username) {
  return auth.setUsername(username);
}

// DEPRECATED
function openWalletWithPinDEPRECATED(pin, network, done) {
  const credentials = walletDb.getCredentials();
  const { id } = credentials;
  const encryptedSeed = credentials.seed;
  auth.loginDEPRECATED(id, pin, (err, token) => {
    if (err) {
      if (err.message === 'user_deleted') {
        walletDb.deleteCredentials();
      }
      return done(err);
    }
    assignSeedAndId(encryption.decrypt(encryptedSeed, token));
    done();
  });
}

// DEPRECATED
function getPinDEPRECATED() {
  const pin = window.localStorage.getItem('_pin_cs');
  return pin ? encryption.decrypt(pin, 'pinCoinSpace') : null;
}
// DEPRECATED
function resetPinDEPRECATED() {
  window.localStorage.removeItem('_pin_cs');
}

function assignSeedAndId(seed) {
  const id = crypto.createHash('sha256').update(seed).digest('hex');
  state.seed = seed;
  state.id = id;
  emitter.emit('wallet-init', { seed });
}

function initWallet() {
  const networkName = getTokenNetwork();
  let token = getToken();
  if (!isValidWalletToken(token)) {
    setToken(networkName);
    token = false;
  }

  const options = {
    networkName,
    done(err) {
      if (err) {
        return emitter.emit('wallet-error', err);
      }
      emitter.emit('wallet-ready');
    },
  };

  if (networkName === 'ethereum') {
    options.seed = state.seed;
    options.minConf = 12;
    options.token = token;
    convert.setDecimals(token ? token.decimals : 18);
  } else if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash'].indexOf(networkName) !== -1) {
    options.hdkey = HDKey.fromMasterSeed(new Buffer(state.seed, 'hex'));
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
    options.seed = state.seed;
    convert.setDecimals(0);
  } else if (networkName === 'stellar') {
    options.seed = state.seed;
    convert.setDecimals(0);
  } else if (networkName === 'eos') {
    options.seed = state.seed;
    options.accountName = db.get('eosAccountName') || '';
    if (process.env.NODE_ENV === 'development') {
      options.chainId = 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473';
    }
    convert.setDecimals(0);
  }

  state.wallet = new Wallet[networkName](options);
  state.wallet.denomination = token ? denomination(token) : denomination(networkName);
  state.wallet.name = names[state.wallet.denomination] || state.wallet.denomination;
}

function isValidWalletToken(token) {
  if (token && token.isDefault) return true;
  const walletTokens = db.get('walletTokens') || [];
  const isFound = _.find(walletTokens, (item) => {
    return _.isEqual(token, item);
  });
  return !!isFound;
}

function parseHistoryTx(tx) {
  const { networkName } = state.wallet;
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

function sync() {
  initWallet(state.wallet.networkName);
}

function getWallet() {
  return state.wallet;
}

function getId() {
  return state.id;
}

// DEPRECATED
function walletExistsDEPRECATED() {
  return !!walletDb.getCredentials();
}

// DEPRECATED
function deleteCredentialsDEPRECATED() {
  walletDb.deleteCredentials();
}

function walletRegistered() {
  return walletDb.isRegistered();
}

function reset() {
  walletDb.deleteCredentials();
  walletDb.reset();
  emitter.emit('wallet-reset');
  resetPinDEPRECATED();
}

function getDestinationInfo(to) {
  if (state.wallet.networkName === 'ripple' || state.wallet.networkName === 'stellar') {
    return state.wallet.getDestinationInfo(to);
  } else {
    return Promise.resolve();
  }
}

function setToAlias(data) {
  if (state.wallet.networkName !== 'bitcoincash') return;
  try {
    const legacy = bchaddr.toLegacyAddress(data.to);
    if (legacy !== data.to) {
      data.alias = data.to;
      data.to = legacy;
    }
  // eslint-disable-next-line
  } catch (e) {}
}

emitter.on('db-ready', () => {
  initWallet();
});

emitter.on('db-error', (err) => {
  emitter.emit('wallet-error', err);
});

module.exports = {
  openWalletWithPinDEPRECATED,
  createWallet,
  //setPin,
  registerWallet,
  migrateWallet,
  loginWithPin,
  loginWithFido,
  removeAccount,
  setUsername,
  getWallet,
  getId,
  walletExistsDEPRECATED,
  deleteCredentialsDEPRECATED,
  walletRegistered,
  reset,
  sync,
  initWallet,
  validateSend,
  parseHistoryTx,
  getPinDEPRECATED,
  resetPinDEPRECATED,
  getDestinationInfo,
  setToAlias,
};
