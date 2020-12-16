'use strict';

const Worker = require('worker-loader?inline&fallback=false!./worker.js');
const worker = new Worker();

const LS = require('./localStorage');
const seeds = require('./seeds');
const emitter = require('lib/emitter');
const crypto = require('crypto');
const encryption = require('lib/encryption');
const CsWallet = require('@coinspace/cs-wallet');
const validateSend = require('./validator');
const request = require('lib/request');
const EthereumWallet = require('@coinspace/cs-ethereum-wallet');
const RippleWallet = require('@coinspace/cs-ripple-wallet');
const StellarWallet = require('@coinspace/cs-stellar-wallet');
const EOSWallet = require('@coinspace/cs-eos-wallet');
const { eddsa } = require('elliptic');
const ec = new eddsa('ed25519');
const touchId = require('lib/touch-id');
const ticker = require('lib/ticker-api');

const convert = require('lib/convert');
const { getCrypto } = require('lib/crypto');
const details = require('lib/wallet/details');
const settings = require('lib/wallet/settings');
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

async function registerWallet(pin) {
  const pinKey = crypto.randomBytes(32).toString('hex');
  const walletSeed = seeds.get('private');
  const wallet = ec.keyFromSecret(walletSeed);
  const deviceSeed = crypto.randomBytes(32).toString('hex');
  const device = ec.keyFromSecret(deviceSeed);
  const deviceId = device.getPublic('hex');
  const pinHash = crypto.createHmac('sha256', Buffer.from(pinKey, 'hex')).update(pin).digest('hex');
  const detailsKey = crypto.createHmac('sha256', 'Coin Wallet').update(walletSeed).digest('hex');
  const { publicToken, privateToken } = await request({
    url: `${urlRoot}api/v2/register`,
    method: 'post',
    data: {
      walletId: wallet.getPublic('hex'),
      deviceId,
      pinHash,
    },
    seed: 'private',
    id: false,
  });
  seeds.set('public', deviceSeed, publicToken);
  seeds.set('private', walletSeed, privateToken);
  LS.setEncryptedSeed('public', encryption.encrypt(deviceSeed, publicToken));
  LS.setEncryptedSeed('private', encryption.encrypt(walletSeed, privateToken));
  LS.setPinKey(pinKey);
  LS.setId(deviceId);
  LS.setDetailsKey(detailsKey);
  await Promise.all([details.init(), settings.init()]);
  await initWallet(pin);
}

async function loginWithPin(pin) {
  if (LS.isRegisteredLegacy()) {
    return migrateLegacyWallet(pin);
  }
  const pinHash = crypto.createHmac('sha256', Buffer.from(LS.getPinKey(), 'hex')).update(pin).digest('hex');
  const { publicToken } = await request({
    url: `${urlRoot}api/v2/token/public/pin`,
    method: 'post',
    data: {
      pinHash,
    },
    id: true,
  });
  seeds.unlock('public', publicToken);
  await Promise.all([details.init(), settings.init()]);
  await initWallet();
}

async function loginWithTouchId(showSpinner) {
  if (process.env.BUILD_TYPE === 'phonegap') {
    await touchId.phonegap();
    const pin = LS.getPin();
    showSpinner();
    if (LS.isRegisteredLegacy()) {
      return migrateLegacyWallet(pin);
    }
    return loginWithPin(pin);
  } else {
    const publicToken = await touchId.publicToken();
    showSpinner();
    seeds.unlock('public', publicToken);
    await Promise.all([details.init(), settings.init()]);
    await initWallet();
  }
}

async function initWallet(pin) {
  const crypto = getCrypto();

  const seed = seeds.get('private');
  if (seed) {
    Object.keys(Wallet).forEach((key) => {
      const wallet = new Wallet[key]({
        seed,
        networkName: key,
      });
      wallet.lock();
      LS.setPublicKey(wallet, seeds.get('public'));
    });
  }
  const publicKey = LS.getPublicKey(crypto.network, seeds.get('public'));
  const options = Object.assign({
    publicKey,
    networkName: crypto.network,
  }, getExtraOptions(crypto));
  state.wallet = new Wallet[crypto.network](options);

  if (crypto.network === 'ethereum') {
    convert.setDecimals(crypto.decimals || 18);
  } else if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash'].includes(crypto._id)) {
    convert.setDecimals(8);
  } else if (crypto._id === 'ripple') {
    convert.setDecimals(0);
  } else if (crypto._id === 'stellar') {
    convert.setDecimals(0);
  } else if (crypto._id === 'eos') {
    convert.setDecimals(0);
  }

  await ticker.init(crypto._id);

  state.wallet.load({
    getDynamicFees() {
      return request({
        url: `${urlRoot}api/v2/fees`,
        params: {
          crypto: crypto._id,
        },
        method: 'get',
        seed: 'public',
      }).catch(console.error);
    },
    getCsFee() {
      return request({
        url: urlRoot + 'api/v1/csFee',
        // TODO move to _id
        params: { network: crypto.network },
        id: true,
      }).catch(console.error);
    },
    done(err) {
      emitter.emit('wallet-ready', { pin, err });
    },
  });
}

function getExtraOptions(crypto) {
  const options = {};
  if (crypto.network === 'ethereum') {
    options.minConf = 12;
    options.token = crypto._id !== 'ethereum' ? crypto : false;
  } else if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash'].includes(crypto.network)) {
    const addressType = details.get(crypto.network + '.addressType');
    if (addressType) {
      options.addressType = addressType;
    }
    options.minConf = 3;
    if (crypto.network === 'bitcoincash') {
      options.minConf = 0;
    }
  } else if (crypto.network === 'eos') {
    options.accountName = details.get('eosAccountName') || '';
  }
  return options;
}

async function removeAccount() {
  await request({
    url: `${urlRoot}api/v2/wallet`,
    method: 'delete',
    seed: 'private',
  });
  LS.reset();
}

function setUsername(username) {
  const userInfo = details.get('userInfo');
  const oldUsername = (userInfo.username || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const newUsername = (username || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (newUsername === oldUsername) {
    return Promise.resolve(userInfo.username);
  }
  return request({
    url: `${urlRoot}api/v2/username`,
    method: 'put',
    data: {
      username: newUsername,
    },
    seed: 'public',
  }).then((data) => {
    return data.username;
  });
}

function getWallet() {
  return state.wallet;
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

async function migrateLegacyWallet(pin) {
  await loginWithPinLegacy(pin);
  await registerWallet(pin);
  LS.deleteCredentialsLegacy();
}

// DEPRECATED
async function loginWithPinLegacy(pin) {
  const credentials = LS.getCredentials();
  const { id } = credentials;
  const encryptedSeed = credentials.seed;
  const token = await request({
    url: `${urlRoot}api/v1/login`,
    method: 'post',
    data: { wallet_id: id, pin },
  });
  seeds.set('private', encryption.decrypt(encryptedSeed, token));
}

module.exports = {
  createWallet,
  registerWallet,
  loginWithPin,
  loginWithTouchId,
  removeAccount,
  setUsername,
  getWallet,
  initWallet,
  validateSend,
  getDestinationInfo,
  setToAlias,
};
