const worker = new Worker(new URL('./worker.js', import.meta.url));
import LS from './localStorage';

import seeds from './seeds';
import emitter from 'lib/emitter';
import crypto from 'crypto';
import encryption from 'lib/encryption';
import request from 'lib/request';
import Storage from 'lib/storage';
import { unlock, lock } from 'lib/wallet/security';

import CsWallet from '@coinspace/cs-wallet';
import EthereumWallet from '@coinspace/cs-ethereum-wallet';
import RippleWallet from '@coinspace/cs-ripple-wallet';
import StellarWallet from '@coinspace/cs-stellar-wallet';
import EOSWallet from '@coinspace/cs-eos-wallet';
import MoneroWallet from '@coinspace/cs-monero-wallet';

import { eddsa } from 'elliptic';

const ec = new eddsa('ed25519');
import touchId from 'lib/touch-id';
import ticker from 'lib/ticker-api';
import convert from 'lib/convert';
import { getCrypto } from 'lib/crypto';
import details from 'lib/wallet/details';
import settings from 'lib/wallet/settings';
import bchaddr from 'bchaddrjs';

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
  monero: MoneroWallet,
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

async function registerWallet(pin, widget) {
  widget && widget.loadingWallet();
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
  await Promise.all([details.init(), settings.init()]);
  emitter.emit('auth-success', pin);
  await initWallet(walletSeed);
}

async function loginWithPin(pin, widget) {
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
  widget && widget.loadingWallet();
  seeds.unlock('public', publicToken);
  await Promise.all([details.init(), settings.init()]);
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
    return loginWithPin(pin, widget);
  } else {
    const publicToken = await touchId.publicToken(widget);
    widget && widget.loadingWallet();
    seeds.unlock('public', publicToken);
    await Promise.all([details.init(), settings.init()]);
    emitter.emit('auth-success');
    await initWallet();
  }
}

export async function initWallet(seed) {
  const crypto = getCrypto();

  if (seed) {
    for (const key of Object.keys(Wallet)) {
      const wallet = new Wallet[key]({
        seed,
        networkName: key,
        ...await getExtraOptions({ network: key }),
      });
      wallet.lock();
      LS.setPublicKey(wallet, seeds.get('public'));
    }
  }

  const publicKey = LS.getPublicKey(crypto.network, seeds.get('public'));
  state.wallet = new Wallet[crypto.network]({
    publicKey,
    networkName: crypto.network,
    ...await getExtraOptions(crypto),
  });

  convert.setDecimals(state.wallet.decimals);

  await ticker.init([crypto]);

  try {
    await state.wallet.load();

    emitter.emit('wallet-ready');
  } catch (err) {
    emitter.emit('wallet-error', err);
  }
}

async function getExtraOptions(crypto) {
  const options = {
    useTestNetwork: process.env.COIN_NETWORK === 'regtest',
  };

  if (crypto.network === 'bitcoin') {
    options.apiNode = process.env.API_BTC_URL;
  } else if (crypto.network === 'bitcoincash') {
    options.apiNode = process.env.API_BCH_URL;
  } else if (crypto.network === 'bitcoinsv') {
    options.apiNode = process.env.API_BSV_URL;
  } else if (crypto.network === 'litecoin') {
    options.apiNode = process.env.API_LTC_URL;
  } else if (crypto.network === 'dogecoin') {
    options.apiNode = process.env.API_DOGE_URL;
  } else if (crypto.network === 'dash') {
    options.apiNode = process.env.API_DASH_URL;
  }

  if (crypto.network === 'ethereum') {
    options.name = crypto.name;
    options.minConf = 12;
    options.token = crypto._id !== 'ethereum' ? crypto : false;
    options.decimals = crypto.decimals !== undefined ? crypto.decimals : 18;
  } else if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash'].includes(crypto.network)) {
    const addressType = details.get(crypto.network + '.addressType');
    if (addressType) {
      options.addressType = addressType;
    }
    options.minConf = 3;
    if (crypto.network === 'bitcoincash') {
      options.minConf = 0;
    }
    options.getDynamicFees = () => {
      return request({
        url: `${process.env.SITE_URL}api/v2/fees`,
        params: {
          crypto: crypto._id,
        },
        method: 'get',
        seed: 'public',
      }).catch(console.error);
    };
    options.getCsFee = () => {
      return request({
        url: `${process.env.SITE_URL}api/v1/csFee`,
        // TODO move to _id
        params: { network: crypto.network },
        id: true,
      }).catch(console.error);
    };
  } else if (crypto.network === 'eos') {
    options.accountName = details.get('eosAccountName') || '';
  } else if (crypto.network === 'monero') {
    options.wasm = (await import('@coinspace/monero-core-js/build/MoneroCoreJS.wasm')).default;
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
    const wallet = new Wallet[crypto.network]({
      seed: seeds.get('private'),
      networkName: crypto.network,
      ...await getExtraOptions(crypto),
    });
    LS.setPublicKey(wallet, seeds.get('public'));
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

export function getDestinationInfo(to) {
  if (state.wallet.networkName === 'stellar') {
    return state.wallet.getDestinationInfo(to);
  } else {
    return Promise.resolve();
  }
}

export function setToAlias(data) {
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
    url: `${process.env.SITE_URL}api/v1/login`,
    method: 'post',
    data: { wallet_id: id, pin },
  });
  seeds.set('private', encryption.decrypt(encryptedSeed, token));
}

export default {
  createWallet,
  registerWallet,
  loginWithPin,
  loginWithTouchId,
  removeAccount,
  setUsername,
  getWallet,
  initWallet,
  updateWallet,
  addPublicKey,
  getDestinationInfo,
  setToAlias,
};
