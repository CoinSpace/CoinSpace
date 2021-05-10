const worker = new Worker(new URL('./worker.js', import.meta.url));
import LS from './localStorage';

import seeds from './seeds';
import emitter from 'lib/emitter';
import crypto from 'crypto';
import encryption from 'lib/encryption';
import request from 'lib/request';
import Cache from 'lib/cache';
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

// UI debug
/*
class FakeWallet {
  constructor() {
    this.networkName = 'monero';
    this.denomination = 'XMR';
    this.decimals = 12;
  }
  lock() {}
  publicKey() { return ''; }
  getBalance() { return '0'; }
  getMaxAmount() { return '0'; }
  getNextAddress() { return 'next address'; }
  loadTxs() { return Promise.resolve({ txs: [] }); }
  load(options) {
    const { done } = options;
    done(null);
  }
}
*/

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
  await Promise.all([details.init(), settings.init()]);
  await initWallet(pin);
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
  await Promise.all([details.init(), settings.init()]);
  await initWallet();
}

async function loginWithTouchId(showSpinner) {
  if (process.env.BUILD_TYPE === 'phonegap') {
    await touchId.phonegap();
    showSpinner();
    const pin = LS.getPin();
    if (LS.isRegisteredLegacy()) {
      return migrateLegacyWallet(pin);
    }
    return loginWithPin(pin);
  } else {
    const publicToken = await touchId.publicToken(showSpinner);
    seeds.unlock('public', publicToken);
    await Promise.all([details.init(), settings.init()]);
    await initWallet();
  }
}

export async function initWallet(pin) {
  const crypto = getCrypto();

  const seed = seeds.get('private');
  if (seed) {
    Object.keys(Wallet).forEach((key) => {
      const wallet = new Wallet[key]({
        seed,
        networkName: key,
        ...getExtraOptions({ network: key }),
      });
      wallet.lock();
      LS.setPublicKey(wallet, seeds.get('public'));
    });
  }

  if (!seed && !LS.hasPublicKey(crypto.network)) {
    await unlock();
    state.wallet = new Wallet[crypto.network]({
      seed: seeds.get('private'),
      networkName: crypto.network,
      ...getExtraOptions(crypto),
    });
    state.wallet.lock();
    await lock();
    LS.setPublicKey(state.wallet, seeds.get('public'));
  } else {
    const publicKey = LS.getPublicKey(crypto.network, seeds.get('public'));
    const options = Object.assign({
      publicKey,
      networkName: crypto.network,
    }, getExtraOptions(crypto));
    state.wallet = new Wallet[crypto.network](options);
  }

  convert.setDecimals(state.wallet.decimals);

  await ticker.init([crypto]);

  try {
    await state.wallet.load({
      getDynamicFees() {
        return request({
          url: `${process.env.SITE_URL}api/v2/fees`,
          params: {
            crypto: crypto._id,
          },
          method: 'get',
          seed: 'public',
        }).catch(console.error);
      },
      getCsFee() {
        return request({
          url: `${process.env.SITE_URL}api/v1/csFee`,
          // TODO move to _id
          params: { network: crypto.network },
          id: true,
        }).catch(console.error);
      },
    });

    emitter.emit('wallet-ready', { pin });
  } catch (err) {
    // TODO maybe migrate to wallet-error
    emitter.emit('wallet-ready', { pin, err });
  }
}

function getExtraOptions(crypto) {
  const options = {
    useTestNetwork: process.env.COIN_NETWORK === 'regtest',
  };
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
  } else if (crypto.network === 'eos') {
    options.accountName = details.get('eosAccountName') || '';
  } else if (crypto.network === 'monero') {
    options.cache = new Cache(process.env.SITE_URL, 'monero', LS.getDetailsKey());
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
  getDestinationInfo,
  setToAlias,
};
