const worker = new Worker(new URL('./worker.js', import.meta.url));
import LS from './localStorage';

import seeds from './seeds';
import emitter from 'lib/emitter';
import crypto from 'crypto';
import encryption from 'lib/encryption';
import request from 'lib/request';
import Storage from 'lib/storage';
import cryptoDb from 'lib/crypto-db';
import { init as initCrypto } from 'lib/crypto';
import { unlock, lock } from 'lib/wallet/security';

import CsWallet from '@coinspace/cs-wallet';
import EthereumWallet from '@coinspace/cs-ethereum-wallet';
import BinanceSmartChainWallet from '@coinspace/cs-binance-smart-chain-wallet';
import RippleWallet from '@coinspace/cs-ripple-wallet';
import StellarWallet from '@coinspace/cs-stellar-wallet';
// import EOSWallet from '@coinspace/cs-eos-wallet';
// import MoneroWallet from '@coinspace/cs-monero-wallet';

import { eddsa } from 'elliptic';

const ec = new eddsa('ed25519');
import touchId from 'lib/touch-id';
import ticker from 'lib/ticker-api';
import convert from 'lib/convert';
import details from 'lib/wallet/details';
import settings from 'lib/wallet/settings';
import bchaddr from 'bchaddrjs';

const state = {
  wallet: null,
};
export const walletCoins = [
  'bitcoin@bitcoin',
  'bitcoin-cash@bitcoin-cash',
  'bitcoin-sv@bitcoin-sv',
  'litecoin@litecoin',
  'ethereum@ethereum',
  'xrp@ripple',
  'stellar@stellar',
  'dogecoin@dogecoin',
  'dash@dash',
  'binance-smart-chain@binance-smart-chain',
].map((id) => cryptoDb.find((item) => item._id === id));

const Wallet = {
  bitcoin: CsWallet,
  'bitcoin-cash': CsWallet,
  'bitcoin-sv': CsWallet,
  litecoin: CsWallet,
  ethereum: EthereumWallet,
  ripple: RippleWallet,
  stellar: StellarWallet,
  // eos: EOSWallet,
  // dogecoin: CsWallet,
  dash: CsWallet,
  // monero: MoneroWallet,
  'binance-smart-chain': BinanceSmartChainWallet,
};

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
    url: `${process.env.SITE_URL}api/v2/register`,
    method: 'post',
    data: {
      walletId: wallet.getPublic('hex'),
      deviceId,
      pinHash,
    },
    seed: 'private',
    id: false,
  });
  seeds.set('public', deviceSeed);
  LS.setEncryptedSeed('public', encryption.encrypt(deviceSeed, publicToken));
  LS.setEncryptedSeed('private', encryption.encrypt(walletSeed, privateToken));
  LS.setPinKey(pinKey);
  LS.setId(deviceId);
  LS.setDetailsKey(detailsKey);
  await Promise.all([details.init(), settings.init()]).then(initCrypto);
  emitter.emit('auth-success', pin);
  await initWallet(walletSeed);
}

async function loginWithPin(pin) {
  if (LS.isRegisteredLegacy()) {
    return migrateLegacyWallet(pin);
  }
  const pinHash = crypto.createHmac('sha256', Buffer.from(LS.getPinKey(), 'hex')).update(pin).digest('hex');
  const { publicToken } = await request({
    url: `${process.env.SITE_URL}api/v2/token/public/pin`,
    method: 'post',
    data: {
      pinHash,
    },
    id: true,
  });
  seeds.unlock('public', publicToken);
  await Promise.all([details.init(), settings.init()]).then(initCrypto);
  emitter.emit('auth-success');
  await initWallet();
}

async function loginWithTouchId(widget) {
  if (process.env.BUILD_TYPE === 'phonegap') {
    await touchId.phonegap();
    widget && widget.loading();
    const pin = LS.getPin();
    if (LS.isRegisteredLegacy()) {
      return migrateLegacyWallet(pin);
    }
    return loginWithPin(pin);
  } else {
    const { publicToken } = await touchId.publicToken(widget);
    seeds.unlock('public', publicToken);
    await Promise.all([details.init(), settings.init()]).then(initCrypto);
    emitter.emit('auth-success');
    await initWallet();
  }
}

export async function initWallet(seed) {
  LS.migratePublicKeys();
  const walletTokens = details.get('tokens');
  const all = [...walletCoins, ...walletTokens];

  let defaultCryptoId = localStorage.getItem('_cs_crypto_id') || 'bitcoin@bitcoin';
  if (!all.find((item) => item._id === defaultCryptoId)) {
    defaultCryptoId = 'bitcoin@bitcoin';
    localStorage.setItem('_cs_crypto_id', defaultCryptoId);
  }

  for (const crypto of all) {
    let wallet;
    if (seed) {
      initWalletWithSeed(crypto, seed);
      if (crypto._id !== defaultCryptoId) {
        try {
          await wallet.load();
        } catch (err) {
          console.error(err);
        }
      }
    } else {
      if (!LS.hasPublicKey(crypto.platform)) continue;
      initWalletWithPublicKey(crypto);
    }
  }
  state.wallet = state[defaultCryptoId];

  convert.setDecimals(state.wallet.crypto.decimals);
  await ticker.init([state.wallet.crypto]);

  try {
    await state.wallet.load();
    emitter.emit('wallet-ready');
  } catch (err) {
    emitter.emit('wallet-error', err);
  }
}

// TODO: fix it
function getExtraOptions(crypto) {
  const options = {
    useTestNetwork: process.env.COIN_NETWORK === 'regtest',
  };

  if (crypto.platform === 'bitcoin') {
    options.apiNode = process.env.API_BTC_URL;
  } else if (crypto.platform === 'bitcoin-cash') {
    options.apiNode = process.env.API_BCH_URL;
  } else if (crypto.platform === 'bitcoin-sv') {
    options.apiNode = process.env.API_BSV_URL;
  } else if (crypto.platform === 'litecoin') {
    options.apiNode = process.env.API_LTC_URL;
  } else if (crypto.platform === 'dogecoin') {
    options.apiNode = process.env.API_DOGE_URL;
  } else if (crypto.platform === 'dash') {
    options.apiNode = process.env.API_DASH_URL;
  }

  if (crypto.platform === 'ethereum') {
    options.minConf = 12;
    options.request = request;
    options.apiNode = process.env.API_ETH_URL;
    options.platformCrypto = walletCoins.find((item) => item._id === 'ethereum@ethereum');
  } else if (crypto.platform === 'binance-smart-chain') {
    options.minConf = 12;
    options.request = request;
    options.apiNode = process.env.API_BSC_URL;
    options.platformCrypto = walletCoins.find((item) => item._id === 'binance-smart-chain@binance-smart-chain');
  } else if (['bitcoin', 'bitcoin-cash', 'bitcoin-sv', 'litecoin', 'dogecoin', 'dash'].includes(crypto.platform)) {
    const addressType = details.get(crypto.platform + '.addressType');
    if (addressType) {
      options.addressType = addressType;
    }
    options.minConf = 3;
    if (crypto.platform === 'bitcoin-cash') {
      options.minConf = 0;
    }
    options.getDynamicFees = () => {
      return request({
        url: `${process.env.SITE_URL}api/v2/fees`,
        params: {
          crypto: crypto.platform,
        },
        method: 'get',
        seed: 'public',
      }).catch(console.error);
    };
    options.getCsFee = () => {
      return request({
        url: `${process.env.SITE_URL}api/v1/csFee`,
        // TODO move to _id
        params: { network: crypto.platform },
        id: true,
      }).catch(console.error);
    };
  } else if (crypto.platform === 'eos') {
    options.accountName = details.get('eosAccountName') || '';
  } else if (crypto.platform === 'monero') {
    const addressType = details.get(crypto.platform + '.addressType');
    if (addressType) {
      options.addressType = addressType;
    }
    if (process.env.BUILD_TYPE === 'phonegap') {
      options.wasm = (new URL('@coinspace/monero-core-js/build/MoneroCoreJS.wasm', import.meta.url)).href;
    } else {
      options.wasm = require('@coinspace/monero-core-js/build/MoneroCoreJS.wasm');
    }
    options.storage = new Storage(process.env.SITE_URL, 'monero', LS.getDetailsKey());
    options.request = request;
    options.apiNode = process.env.API_XMR_URL;
    options.apiWeb = process.env.SITE_URL;
  }
  return options;
}

export async function updateWallet() {
  if (typeof state.wallet.update === 'function') {
    await state.wallet.update();
    emitter.emit('wallet-update');
  }
}

export async function addPublicKey(crypto) {
  try {
    await unlock();
    initWalletWithSeed(crypto, seeds.get('private'));
    lock();
  } catch (err) {
    lock();
    if (err.message !== 'cancelled') console.error(err);
    throw err;
  }
}

async function removeAccount() {
  await request({
    url: `${process.env.SITE_URL}api/v2/wallet`,
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
    url: `${process.env.SITE_URL}api/v2/username`,
    method: 'put',
    data: {
      username: newUsername,
    },
    seed: 'public',
  }).then((data) => {
    return data.username;
  });
}

export function getWallet() {
  return state.wallet;
}

export function getWalletById(cryptoId) {
  return state[cryptoId];
}

export function switchWallet(crypto) {
  if (!state[crypto._id]) {
    initWalletWithPublicKey(crypto);
  }
  localStorage.setItem('_cs_crypto_id', crypto._id);
  state.wallet = state[crypto._id];
}

export function unsetWallet(crypto) {
  delete state[crypto._id];
}

export function getDestinationInfo(to) {
  if (state.wallet.crypto.platform === 'stellar') {
    return state.wallet.getDestinationInfo(to);
  } else {
    return Promise.resolve();
  }
}

export function setToAlias(data) {
  if (state.wallet.crypto.platform !== 'bitcoin-cash') return;
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
    url: `${process.env.SITE_URL}api/v1/login`,
    method: 'post',
    data: { wallet_id: id, pin },
  });
  seeds.set('private', encryption.decrypt(encryptedSeed, token));
}

function initWalletWithSeed(crypto, seed) {
  const wallet = new Wallet[crypto.platform]({
    seed,
    crypto,
    ...getExtraOptions(crypto),
  });
  LS.setPublicKey(wallet, seeds.get('public'));
  wallet.lock();
  state[crypto._id] = wallet;
}

function initWalletWithPublicKey(crypto) {
  const publicKey = LS.getPublicKey(crypto.platform, seeds.get('public'));
  const wallet = new Wallet[crypto.platform]({
    publicKey,
    crypto,
    ...getExtraOptions(crypto),
  });
  state[crypto._id] = wallet;
}

export default {
  createWallet,
  registerWallet,
  loginWithPin,
  loginWithTouchId,
  removeAccount,
  setUsername,
  getWallet,
  getWalletById,
  switchWallet,
  unsetWallet,
  initWallet,
  updateWallet,
  addPublicKey,
  getDestinationInfo,
  setToAlias,
  walletCoins,
};
