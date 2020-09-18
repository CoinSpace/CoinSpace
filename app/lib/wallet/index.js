'use strict';

const Worker = require('worker-loader?inline&fallback=false!./worker.js');
const worker = new Worker();

const auth = require('./auth');
const LS = require('./localStorage');
const seeds = require('./seeds');
const emitter = require('lib/emitter');
const crypto = require('crypto');
const encryption = require('lib/encryption');
const CsWallet = require('cs-wallet');
const validateSend = require('./validator');
const request = require('lib/request');
const EthereumWallet = require('cs-ethereum-wallet');
const RippleWallet = require('cs-ripple-wallet');
const StellarWallet = require('cs-stellar-wallet');
const EOSWallet = require('cs-eos-wallet');
const { eddsa } = require('elliptic');
const ec = new eddsa('ed25519');
const security = require('./security');
const touchId = require('lib/touch-id');

const convert = require('lib/convert');
const {
  getToken,
  getTokenNetwork,
  setToken,
} = require('lib/token');
const details = require('lib/wallet/details');
const settings = require('lib/wallet/settings');
const _ = require('lodash');
const bchaddr = require('bchaddrjs');

const state = {
  wallet: null,
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

const { urlRoot } = window;

function createWallet(passphrase) {
  const data = { passphrase };
  return new Promise((resolve, reject) => {
    worker.onmessage = function(event) {
      seeds.set('private', event.data.seed);
      resolve({ mnemonic: event.data.mnemonic });
    };
    worker.onerror = function(event) {
      event.preventDefault();
      reject(new Error('Invalid passphrase'));
    };
    worker.postMessage(data);
  });
}

function migrateWallet(pin) {
  // const key = crypto.randomBytes(32).toString('hex');
  // walletDb.setKey(key);
  return registerWallet(pin);
}

async function registerWallet(pin) {
  const pinKey = crypto.randomBytes(32).toString('hex');
  const walletSeed = seeds.get('private');
  const wallet = ec.keyFromSecret(walletSeed);
  const deviceSeed = crypto.randomBytes(32).toString('hex');
  const device = ec.keyFromSecret(deviceSeed);
  const deviceId = device.getPublic('hex');
  const pinHash = crypto.createHmac('sha256', Buffer.from(pinKey, 'hex')).update(pin).digest('hex');
  const detailsKey = crypto.createHmac('sha256', 'hello bro!').update(walletSeed).digest('hex');
  const { publicToken, privateToken } = await request({
    url: `${urlRoot}v2/register`,
    method: 'post',
    data: {
      walletId: wallet.getPublic('hex'),
      deviceId,
      pinHash,
    },
    seed: 'private',
  });
  seeds.set('public', deviceSeed, publicToken);
  seeds.set('private', walletSeed, privateToken);
  LS.setEncryptedSeed('public', encryption.encrypt(deviceSeed, publicToken));
  LS.setEncryptedSeed('private', encryption.encrypt(walletSeed, privateToken));
  LS.setPinKey(pinKey);
  LS.setId(deviceId);
  LS.setDetailsKey(detailsKey);
  await Promise.all([details.init(), settings.init()]);
  initWallet(pin);
}

async function loginWithPin(pin) {
  const pinHash = crypto.createHmac('sha256', Buffer.from(LS.getPinKey(), 'hex')).update(pin).digest('hex');
  const { publicToken } = await request({
    url: `${urlRoot}v2/token/public/pin?id=${LS.getId()}`,
    method: 'post',
    data: {
      pinHash,
    },
  });
  seeds.unlock('public', publicToken);
  await Promise.all([details.init(), settings.init()]);
  initWallet();
}

async function loginWithTouchId(showSpinner) {
  if (process.env.BUILD_TYPE === 'phonegap') {
    await touchId.phonegap();
    const pin = LS.getPin();
    showSpinner();
    return loginWithPin(pin);
  } else {
    const publicToken = await touchId.fido();
    showSpinner();
    seeds.unlock('public', publicToken);
    await Promise.all([details.init(), settings.init()]);
    initWallet();
  }
}

async function loginWithFido() {
  // TODO implement
}

function initWallet(pin) {
  const networkName = getTokenNetwork();
  let token = getToken();
  if (!isValidWalletToken(token)) {
    setToken(networkName);
    token = false;
  }

  let publicKey;
  const seed = seeds.get('private');
  if (seed) {
    Object.keys(Wallet).forEach((key) => {
      let wallet;
      if (key === networkName) {
        wallet = new Wallet[key](Object.assign({ seed, networkName }, getExtraOptions(networkName)));
        state.wallet = wallet;
      } else {
        wallet = new Wallet[key]({ seed, networkName: key });
      }
      LS.setPublicKey(wallet, seeds.get('public'));
    });
    security.lock(state.wallet);
  } else {
    publicKey = LS.getPublicKey(networkName, seeds.get('public'));
    const options = Object.assign({ publicKey, networkName }, getExtraOptions(networkName));
    state.wallet = new Wallet[networkName](options);
  }

  if (networkName === 'ethereum') {
    convert.setDecimals(token ? token.decimals : 18);
  } else if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash'].indexOf(networkName) !== -1) {
    convert.setDecimals(8);
  } else if (networkName === 'ripple') {
    convert.setDecimals(0);
  } else if (networkName === 'stellar') {
    convert.setDecimals(0);
  } else if (networkName === 'eos') {
    convert.setDecimals(0);
  }

  state.wallet.load({
    getDynamicFees() {
      return request({
        url: urlRoot + 'v1/fees',
        params: { network: networkName },
      }).catch(console.error);
    },
    getCsFee() {
      return request({
        url: urlRoot + 'v1/csFee',
        params: { network: networkName },
      }).catch(console.error);
    },
    done(err) {
      if (err) {
        return emitter.emit('wallet-error', err);
      }
      emitter.emit('wallet-ready', pin);
    },
  });

  function getExtraOptions(networkName) {
    const options = {};
    if (networkName === 'ethereum') {
      options.minConf = 12;
      options.token = token;
    } else if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash'].indexOf(networkName) !== -1) {
      options.minConf = 3;
      options.addressType = details.get(networkName + '.addressType') || 'p2pkh';
      if (networkName === 'bitcoincash') {
        options.minConf = 0;
      }
    } else if (networkName === 'eos') {
      options.accountName = details.get('eosAccountName') || '';
    }
    return options;
  }
}

function removeAccount() {
  return request({
    url: `${urlRoot}v2/wallet?id=${LS.getId()}`,
    method: 'delete',
    seed: 'private',
  });
}

function setUsername(username) {
  const userInfo = details.get('userInfo');
  const oldUsername = (userInfo.firstName || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const newUsername = (username || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (newUsername === oldUsername) {
    return Promise.resolve(userInfo.firstName);
  }
  return request({
    url: `${urlRoot}v2/username?id=${LS.getId()}`,
    method: 'put',
    data: {
      username: newUsername,
    },
    seed: 'public',
  }).then((data) => {
    return data.username;
  });
}

function isValidWalletToken(token) {
  if (token && token.isDefault) return true;
  const walletTokens = details.get('walletTokens') || [];
  const isFound = _.find(walletTokens, (item) => {
    return _.isEqual(token, item);
  });
  return !!isFound;
}

function sync() {
  initWallet();
}

function getWallet() {
  return state.wallet;
}

function reset() {
  LS.deleteCredentialsLegacy();
  LS.reset();
  emitter.emit('wallet-reset');
  LS.setPin('');
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

// DEPRECATED
function loginWithPinLegacy(pin, done) {
  const credentials = LS.getCredentials();
  const { id } = credentials;
  const encryptedSeed = credentials.seed;
  auth.loginDEPRECATED(id, pin, (err, token) => {
    if (err) {
      if (err.message === 'user_deleted') {
        LS.deleteCredentialsLegacy();
      }
      return done(err);
    }
    seeds.set('private', encryption.decrypt(encryptedSeed, token));
    done();
  });
}

module.exports = {
  createWallet,
  registerWallet,
  migrateWallet,
  loginWithPin,
  loginWithPinLegacy,
  loginWithTouchId,
  loginWithFido,
  removeAccount,
  setUsername,
  getWallet,
  reset,
  sync,
  initWallet,
  validateSend,
  getDestinationInfo,
  setToAlias,
};
