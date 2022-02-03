const worker = new Worker(new URL('./worker.js', import.meta.url));
import LS from './localStorage';

import seeds from './seeds';
import emitter from 'lib/emitter';
import crypto from 'crypto';
import encryption from 'lib/encryption';
import request from 'lib/request';
import Storage from 'lib/storage';
import { init as initCrypto } from 'lib/crypto';
import { unlock, lock } from 'lib/wallet/security';

import Cache from './cache';
import CsWallet from '@coinspace/cs-wallet';
import EthereumWallet from '@coinspace/cs-ethereum-wallet';
import BinanceSmartChainWallet from '@coinspace/cs-binance-smart-chain-wallet';
import RippleWallet from '@coinspace/cs-ripple-wallet';
import StellarWallet from '@coinspace/cs-stellar-wallet';
import EOSWallet from '@coinspace/cs-eos-wallet';
import MoneroWallet from '@coinspace/cs-monero-wallet';

import bitcoin from '@coinspace/crypto-db/crypto/bitcoin@bitcoin.json';
import litecoin from '@coinspace/crypto-db/crypto/litecoin@litecoin.json';
import dash from '@coinspace/crypto-db/crypto/dash@dash.json';
import bitcoinCash from '@coinspace/crypto-db/crypto/bitcoin-cash@bitcoin-cash.json';
import bitcoinSv from '@coinspace/crypto-db/crypto/bitcoin-sv@bitcoin-sv.json';
import ethereum from '@coinspace/crypto-db/crypto/ethereum@ethereum.json';
import dogecoin from '@coinspace/crypto-db/crypto/dogecoin@dogecoin.json';
import binanceSmartChain from '@coinspace/crypto-db/crypto/binance-coin@binance-smart-chain.json';
import xrp from '@coinspace/crypto-db/crypto/xrp@ripple.json';
import stellar from '@coinspace/crypto-db/crypto/stellar@stellar.json';
import eos from '@coinspace/crypto-db/crypto/eos@eos.json';
import monero from '@coinspace/crypto-db/crypto/monero@monero.json';

import { eddsa } from 'elliptic';

const ec = new eddsa('ed25519');
import touchId from 'lib/touch-id';
import ticker from 'lib/ticker-api';
import convert from 'lib/convert';
import details from 'lib/wallet/details';
import settings from 'lib/wallet/settings';

const state = {
  wallet: null,
  wallets: {},
};
export const walletCoins = [
  bitcoin,
  bitcoinCash,
  bitcoinSv,
  ethereum,
  litecoin,
  xrp,
  stellar,
  eos,
  dogecoin,
  dash,
  monero,
  binanceSmartChain,
];

const Wallet = {
  bitcoin: CsWallet,
  'bitcoin-cash': CsWallet,
  'bitcoin-sv': CsWallet,
  ethereum: EthereumWallet,
  litecoin: CsWallet,
  ripple: RippleWallet,
  stellar: StellarWallet,
  eos: EOSWallet,
  dogecoin: CsWallet,
  dash: CsWallet,
  monero: MoneroWallet,
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
    url: `${process.env.SITE_URL}api/v3/register`,
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
  const pinHash = crypto.createHmac('sha256', Buffer.from(LS.getPinKey(), 'hex')).update(pin).digest('hex');
  const { publicToken } = await request({
    url: `${process.env.SITE_URL}api/v3/token/public/pin`,
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

  let defaultCryptoId = LS.getCryptoId() || 'bitcoin@bitcoin';
  if (!all.find((item) => item._id === defaultCryptoId && LS.hasPublicKey(item.platform))) {
    defaultCryptoId = 'bitcoin@bitcoin';
    LS.setCryptoId(defaultCryptoId);
  }

  for (const crypto of all) {
    if (seed) {
      initWalletWithSeed(crypto, seed);
    } else {
      if (!LS.hasPublicKey(crypto.platform)) continue;
      if (state.wallets[crypto._id]) continue;
      initWalletWithPublicKey(crypto);
    }
  }
  state.wallet = state.wallets[defaultCryptoId];

  convert.setDecimals(state.wallet.crypto.decimals);
  await ticker.init([state.wallet.crypto]);

  const promises = [];
  if (seed) {
    Object.values(state.wallets).forEach((wallet) => {
      if (wallet === state.wallet) return;
      promises.push(wallet.load().catch(console.error));
    });
  }
  promises.push(state.wallet.load().then(() => {
    emitter.emit('wallet-ready');
  }).catch((err) => {
    emitter.emit('wallet-error', err);
  }));
  await Promise.all(promises);
}

function getExtraOptions(crypto) {
  const options = {
    useTestNetwork: process.env.COIN_NETWORK === 'regtest',
    cache: new Cache(crypto),
    crypto,
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
    options.platformCrypto = walletCoins.find((item) => item._id === 'binance-coin@binance-smart-chain');
  } else if (['bitcoin', 'bitcoin-cash', 'bitcoin-sv', 'litecoin', 'dogecoin', 'dash'].includes(crypto.platform)) {
    options.minConf = 3;
    if (crypto.platform === 'bitcoin-cash') {
      options.minConf = 0;
    }
    options.apiWeb = process.env.SITE_URL;
    options.request = function(config = {}) {
      if (!config.seed) {
        config.seed = 'public';
      }
      return request(config);
    };
  } else if (crypto.platform === 'eos') {
    options.storage = new Storage(process.env.SITE_URL, 'eos', LS.getDetailsKey());
  } else if (crypto.platform === 'monero') {
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
    url: `${process.env.SITE_URL}api/v3/wallet`,
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
    url: `${process.env.SITE_URL}api/v3/username`,
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
  return state.wallets[cryptoId];
}

export function switchWallet(crypto) {
  if (!state.wallets[crypto._id]) {
    initWalletWithPublicKey(crypto);
  }
  LS.setCryptoId(crypto._id);
  state.wallet = state.wallets[crypto._id];
}

export function unsetWallet(crypto) {
  delete state.wallets[crypto._id];
}

function initWalletWithSeed(crypto, seed) {
  const wallet = new Wallet[crypto.platform]({
    seed,
    ...getExtraOptions(crypto),
  });
  LS.setPublicKey(wallet, seeds.get('public'));
  wallet.lock();
  state.wallets[crypto._id] = wallet;
}

function initWalletWithPublicKey(crypto) {
  const publicKey = LS.getPublicKey(crypto.platform, seeds.get('public'));
  const wallet = new Wallet[crypto.platform]({
    publicKey,
    ...getExtraOptions(crypto),
  });
  state.wallets[crypto._id] = wallet;
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
  walletCoins,
};
