import * as ed25519 from '@coinspace/ed25519';
import { EventEmitter } from 'events';
import { hex } from '@scure/base';
import { hmac } from '@noble/hashes/hmac';
import { randomBytes } from '@noble/hashes/utils';
import { sha256 } from '@noble/hashes/sha256';
import { CsWallet, errors } from '@coinspace/cs-common';

import Biometry from './Biometry.js';
import Cache from './Cache.js';
import ClientStorage from '../storage/ClientStorage.js';
import CryptoDB from './CryptoDB.js';
import Details from '../storage/Details.js';
import Exchanges from '../exchanges/Exchanges.js';
import Hardware from './Hardware.js';
import Market from './Market.js';
import Mecto from './Mecto.js';
import Ramps from './Ramps.js';
import Request from './Request.js';
import Seeds from './Seeds.js';
import Settings from './Settings.js';
import WalletStorage from '../storage/WalletStorage.js';
import i18n from '../i18n/i18n.js';
import {
  EVM_FAMILY,
  getApiNode,
  loadWalletModule,
} from '../constants.js';

export class CryptoAlreadyAddedError extends TypeError {
  name = 'CryptoAlreadyAddedError';
  constructor(id, options) {
    super(`Crypto '${id}' already added'`, options);
  }
}

export class SeedRequiredError extends Error {
  name = 'SeedRequiredError';
}

class WalletManager {
  #wallets;
  constructor() {
    this.#wallets = new Map();
  }

  set(wallet) {
    this.#wallets.set(wallet.crypto._id, wallet);
  }

  setMany(wallets = []) {
    wallets.forEach((wallet) => this.set(wallet));
  }

  get(id) {
    return this.#wallets.get(id);
  }

  has(id) {
    return this.#wallets.has(id);
  }

  delete(id) {
    this.#wallets.delete(id);
  }

  getByChainId(chainId) {
    return [...this.#wallets.values()].find((wallet) => {
      return wallet.isWalletConnectSupported && wallet.chainId === chainId;
    });
  }

  filterByPlatform(platform) {
    return [...this.#wallets.values()].filter((wallet) => {
      return wallet.crypto.platform === platform;
    });
  }

  filterByType(type) {
    return [...this.#wallets.values()].filter((wallet) => {
      return wallet.crypto.type === type;
    });
  }

  tokensByPlatform(platform) {
    return [...this.#wallets.values()].filter((wallet) => {
      return wallet.crypto.platform === platform && wallet.crypto.type === 'token';
    });
  }

  list() {
    return [...this.#wallets.values()];
  }
}

export default class Account extends EventEmitter {
  #clientStorage;
  #seeds;
  #request;
  #settings;
  #details;
  #market;
  #mecto;
  #cryptoDB;
  #wallets = new WalletManager();
  #deviceSeed;
  #biometry;
  #hardware;
  #ramps;
  #exchanges;
  #needToMigrateV5Balance = false;
  #walletConnect;
  #dummy = false;

  get siteUrl() {
    return this.isOnion ? import.meta.env.VITE_SITE_URL_TOR : import.meta.env.VITE_SITE_URL;
  }

  get clientStorage() {
    return this.#clientStorage;
  }

  get settings() {
    return this.#settings;
  }

  get details() {
    return this.#details;
  }

  get market() {
    return this.#market;
  }

  get mecto() {
    return this.#mecto;
  }

  get cryptoDB() {
    return this.#cryptoDB;
  }

  get biometry() {
    return this.#biometry;
  }

  get hardware() {
    return this.#hardware;
  }

  get ramps() {
    return this.#ramps;
  }

  get exchanges() {
    return this.#exchanges;
  }

  get isCreated() {
    return this.#clientStorage.hasId()
      && this.#clientStorage.hasSeed('device')
      && this.#clientStorage.hasSeed('wallet')
      && this.#clientStorage.hasPinKey()
      && this.#clientStorage.hasDetailsKey();
  }

  get isLocked() {
    return !this.#deviceSeed;
  }

  get isOnion() {
    return this.#clientStorage.isOnion();
  }

  get user() {
    if (this.#details) {
      const user = this.#details.get('userInfo');
      let avatar;
      if (user.email) {
        const hash = hex.encode(sha256(user.email.trim().toLowerCase()));
        avatar = `gravatar:${hash}`;
      } else {
        const hash = hex.encode(hmac(sha256, 'Coin Wallet', hex.encode(this.#clientStorage.getDetailsKey())));
        avatar = `identicon:${hash}`;
      }
      return {
        ...user,
        avatar,
      };
    }
    return {};
  }

  get isHiddenBalance() {
    return this.#clientStorage.isHiddenBalance();
  }

  get isDummy() {
    return this.#dummy;
  }

  get isNewWallet() {
    return this.#details.isNewWallet;
  }

  constructor({ localStorage, release }) {
    super();
    if (!localStorage) {
      throw new TypeError('localStorage is required');
    }

    this.#clientStorage = new ClientStorage({ localStorage });
    this.#seeds = new Seeds({
      clientStorage: this.#clientStorage,
    });
    this.#request = new Request({
      clientStorage: this.#clientStorage,
      release,
    });
    this.#settings = new Settings({
      request: this.request,
    });
    this.#cryptoDB = new CryptoDB({
      request: this.request,
    });
    this.#market = new Market({
      cryptoDB: this.#cryptoDB,
      request: this.request,
      account: this,
    });
    this.#mecto = new Mecto({
      request: this.request,
      account: this,
    });
    this.#biometry = new Biometry({
      request: this.request,
      clientStorage: this.#clientStorage,
    });
    this.#hardware = new Hardware({
      request: this.request,
      account: this,
    });
    this.#ramps = new Ramps({
      request: this.request,
    });
  }

  async create(walletSeed, pin) {
    if (!(walletSeed instanceof Uint8Array)) {
      throw new TypeError('walletSeed must be Uint8Array or Buffer');
    }
    if (walletSeed.length !== 64) {
      throw new TypeError('walletSeed must be 64 bytes');
    }
    this.#clientStorage.clear();

    const walletId = hex.encode(await ed25519.getPublicKeyAsync(walletSeed, false));
    const deviceSeed = randomBytes(32);
    const deviceId = hex.encode(await ed25519.getPublicKeyAsync(deviceSeed));
    const detailsKey = hmac(sha256, 'Coin Wallet', hex.encode(walletSeed));
    const pinKey = randomBytes(32);
    const pinHash = this.pinHash(pin, pinKey);
    this.#deviceSeed = deviceSeed;

    const { deviceToken, walletToken } = await this.request({
      url: '/api/v4/register',
      method: 'post',
      data: {
        walletId,
        deviceId,
        pinHash,
      },
      seed: walletSeed,
      id: false,
    });
    this.#seeds.set('device', deviceSeed, hex.decode(deviceToken));
    this.#seeds.set('wallet', walletSeed, hex.decode(walletToken));
    this.#clientStorage.setPinKey(pinKey);
    this.#clientStorage.setId(deviceId);
    this.#clientStorage.setDetailsKey(detailsKey);

    await this.#init();
    if (!this.isNewWallet) {
      await this.#loadWallets(walletSeed);
    }
  }

  async open(deviceSeed) {
    this.#deviceSeed = deviceSeed;
    await this.#init();
    await this.#loadWallets();
  }

  async loadWallets(cryptos, walletSeed) {
    cryptos.forEach((crypto) => {
      if (crypto.type === 'token') {
        const platform = cryptos.find((item) => item.type === 'coin' && item.platform === crypto.platform);
        if (!platform) cryptos.push(this.#cryptoDB.platform(crypto.platform));
      }
    });
    this.#details.setCryptos(cryptos);
    await this.#loadWallets(walletSeed);
  }

  async #init() {
    await this.#settings.init();
    await this.#cryptoDB.init();
    this.#details = new Details({
      request: this.request,
      key: this.#clientStorage.getDetailsKey(),
      cryptoDB: this.#cryptoDB,
    });
    await this.#details.init();
    this.emit('update', 'user');
    this.emit('update', 'language');
    this.emit('update', 'currency');
    this.emit('update', 'isHiddenBalance');
  }

  async #loadWallets(walletSeed = undefined) {
    const cryptos = this.#details.getSupportedCryptos();

    await this.#market.init({
      cryptos,
      currency: this.#details.get('systemInfo').preferredCurrency,
    });
    this.#exchanges = new Exchanges({
      request: this.request,
      account: this,
    });
    await this.#exchanges.init();
    this.#dummy = hex.encode(this.#clientStorage.getDetailsKey())
      === import.meta.env.VITE_DUMMY_ACCOUNT;

    const walletStorages = await WalletStorage.initMany(this, cryptos);
    const wallets = await Promise.all(cryptos.map(async (crypto) => {
      const wallet = await this.#createWallet({
        crypto,
        walletStorage: walletStorages[crypto._id],
      }, walletSeed);
      // save public key only for coins
      if (crypto.type === 'coin') {
        this.#clientStorage.setPublicKey(crypto.platform, wallet.getPublicKey(), this.#deviceSeed);
        this.#details.setPlatformSettings(crypto.platform, wallet.settings);
      }
      if (this.#details.needToMigrateV5Balance) {
        await this.#migrateV5Balance(wallet);
      }
      return wallet;
    }));
    this.#wallets.setMany(wallets);
    await this.#details.save();
    this.emit('update');
  }

  async #createWallet({ crypto, walletStorage, settings }, walletSeed) {
    const Wallet = await loadWalletModule(crypto.platform);
    const platform = this.#cryptoDB.platform(crypto.platform);
    const options = this.#getWalletOptions(crypto, platform, walletStorage, settings);
    const wallet = new Wallet(options);
    if (walletSeed) {
      await wallet.create(walletSeed);
    } else if (this.#clientStorage.hasPublicKey(crypto.platform)) {
      await wallet.open(this.#clientStorage.getPublicKey(crypto.platform, this.#deviceSeed));
    } else {
      wallet.state = CsWallet.STATE_NEED_INITIALIZATION;
    }
    return wallet;
  }

  #getApiNode(platform) {
    return getApiNode(platform, this.isOnion);
  }

  #getWalletOptions(crypto, platform, storage, settings) {
    const cache = new Cache({
      crypto,
      clientStorage: this.#clientStorage,
      deviceSeed: this.#deviceSeed,
    });
    const options = {
      crypto,
      platform,
      request: this.request,
      apiNode: this.#getApiNode(crypto.platform),
      cache,
      storage,
      settings: settings || this.#details.getPlatformSettings(crypto.platform),
      development: import.meta.env.DEV,
    };
    if (crypto._id === 'monero@monero') {
      options.wasm = (new URL('@coinspace/monero-core-js/build/MoneroCoreJS.wasm', import.meta.url)).href;
    }
    return options;
  }

  async getCustomTokenInfo(platform, address = '') {
    if (EVM_FAMILY.includes(platform)) {
      address = address.toLowerCase();
    }
    const token = this.#cryptoDB.getTokenByAddress(platform, address);
    if (token) return token;
    const info = await this.request({
      baseURL: this.#getApiNode(platform),
      url: `api/v1/token/${address}`,
    });
    if (info?.name && info?.symbol && info?.decimals !== undefined) {
      return {
        _id: `${address}@${platform}`,
        platform,
        type: 'token',
        name: info.name,
        symbol: info.symbol,
        address,
        decimals: parseInt(info.decimals, 10),
        custom: true,
      };
    } else {
      throw new errors.AddressError(`Invalid contract address ${address}`);
    }
  }

  async getTokenUrl(platform, address) {
    try {
      const Wallet = await loadWalletModule(platform);
      return Wallet.tokenUrl(platform, address, import.meta.env.DEV);
    } catch {
      return undefined;
    }
  }

  wallet(id) {
    return this.#wallets.get(id);
  }

  wallets(type = '') {
    if (type) return this.#wallets.filterByType(type);
    return this.#wallets.list();
  }

  tokensByPlatform(platform) {
    return this.#wallets.tokensByPlatform(platform);
  }

  walletByChainId(chainId) {
    return this.#wallets.getByChainId(chainId);
  }

  hasWallet(id) {
    return this.#wallets.has(id);
  }

  toggleOnion() {
    this.#clientStorage.toggleOnion();
    for (const wallet of this.#wallets.list()) {
      wallet.apiNode = this.#getApiNode(wallet.crypto.platform);
    }
    this.emit('update', 'isOnion');
  }

  logout() {
    this.#clientStorage.clear();
    this.emit('logout');
  }

  async remove(walletSeed) {
    await this.request({
      url: '/api/v4/wallet',
      method: 'delete',
      seed: walletSeed,
    });
    this.logout();
  }

  /**
   * Adding a new wallet to the account.
   * If there is a public key, then unlocking the private seed is not requested.
   */
  async addWallet(crypto, walletSeed) {
    if (this.#details.hasCrypto(crypto)) {
      throw new CryptoAlreadyAddedError(crypto._id);
    }
    if (this.#clientStorage.hasPublicKey(crypto.platform)) {
      const walletStorage = await WalletStorage.initOne(this, crypto);
      this.#wallets.set(await this.#createWallet({ crypto, walletStorage }));
      this.#details.addCrypto(crypto);
    } else if (walletSeed) {
      if (crypto.type === 'coin') {
        const walletStorage = await WalletStorage.initOne(this, crypto);
        const wallet = await this.#createWallet({
          crypto,
          walletStorage,
        }, walletSeed);
        this.#wallets.set(wallet);
        this.#details.setPlatformSettings(crypto.platform, wallet.settings);
        this.#clientStorage.setPublicKey(wallet.crypto.platform, wallet.getPublicKey(), this.#deviceSeed);
        this.#details.addCrypto(crypto);
      }
      if (crypto.type === 'token') {
        const platform = this.#cryptoDB.platform(crypto.platform);
        const walletStorages = await WalletStorage.initMany(this, [crypto, platform]);
        const wallet = await this.#createWallet({
          crypto: platform,
          walletStorage: walletStorages[platform._id],
        }, walletSeed);
        this.#wallets.set(wallet);
        this.#details.setPlatformSettings(crypto.platform, wallet.settings);
        this.#clientStorage.setPublicKey(wallet.crypto.platform, wallet.getPublicKey(), this.#deviceSeed);
        this.#wallets.set(await this.#createWallet({
          crypto,
          walletStorage: walletStorages[crypto._id],
        }));
        this.#details.addCrypto(platform);
        this.#details.addCrypto(crypto);
      }
    } else {
      throw new SeedRequiredError();
    }

    await this.#details.save();
    this.emit('update');
  }

  async removeWallet(crypto) {
    if (crypto.type === 'coin') {
      const wallets = this.#wallets.filterByPlatform(crypto.platform);
      for (const wallet of wallets) {
        this.#wallets.delete(wallet.crypto._id);
        this.#details.removeCrypto(wallet.crypto);
      }
      this.#clientStorage.unsetPublicKey(crypto.platform);
    } else if (crypto.type === 'token') {
      this.#wallets.delete(crypto._id);
      this.#details.removeCrypto(crypto);
    }

    await this.#details.save();
    this.emit('update');
  }

  /**
   * Initialize wallet in NEED_INITIALIZATION state
   * 1. The wallet was added from another device
   * 2. Settings have been changed on another device
   */
  async initWallet(wallet, walletSeed) {
    await wallet.create(walletSeed);
    const publicKey = wallet.getPublicKey();
    const wallets = this.#wallets.filterByPlatform(wallet.crypto.platform);
    for (const item of wallets) {
      // wallet already initialized
      if (item !== wallet) {
        await item.open(publicKey);
      }
    }
    this.#clientStorage.setPublicKey(wallet.crypto.platform, publicKey, this.#deviceSeed);
  }

  async updatePlatformSettings(wallet, settings, walletSeed) {
    const { platform } = wallet.crypto;
    const platformWallets = this.#wallets.filterByPlatform(platform);
    platformWallets.forEach((item) => item.cleanup());
    wallet.settings = settings;
    await wallet.create(walletSeed);
    const publicKey = wallet.getPublicKey();
    this.#clientStorage.setPublicKey(platform, publicKey, this.#deviceSeed);
    for (const platformWallet of platformWallets) {
      if (wallet !== platformWallet) {
        platformWallet.settings = settings;
        await platformWallet.open(publicKey);
      }
    }
    this.#details.setPlatformSettings(platform, settings);
    await this.#details.save();
  }

  async updateUsername(username) {
    if (this.user.username === username) return username;
    const data = await this.request({
      url: '/api/v4/username',
      method: 'put',
      data: {
        username,
      },
      seed: this.#deviceSeed,
    });
    return data.username;
  }

  // binded to this
  getSeed = (type, token) => {
    return this.#seeds.get(type, token);
  };

  // binded to this
  request = (config) => {
    if (config?.seed === 'device') {
      config.seed = this.#deviceSeed;
    }
    return this.#request.request({
      baseURL: this.siteUrl,
      ...config,
    });
  };

  pinHash(pin, pinKey) {
    if (typeof pin !== 'string') {
      throw new TypeError('pin must be string');
    }
    pinKey = pinKey || this.#clientStorage.getPinKey();
    return hex.encode(hmac(sha256, pinKey, pin));
  }

  async getNormalSecurityWalletSeed() {
    let walletToken;
    if (this.settings.get('hasAuthenticators')) {
      walletToken = await this.#hardware.walletToken();
      if (!walletToken) return;
    } else {
      ({ walletToken } = await this.request({
        url: '/api/v4/token/wallet',
        method: 'get',
        seed: 'device',
      }));
    }
    return this.getSeed('wallet', hex.decode(walletToken));
  }

  setPlatformWalletsStateInitialized(platform, excludeWallet) {
    const wallets = this.#wallets.filterByPlatform(platform);
    for (const wallet of wallets) {
      if (wallet.state === CsWallet.STATE_LOADED && wallet !== excludeWallet) {
        wallet.state = CsWallet.STATE_INITIALIZED;
      }
    }
  }


  async #migrateV5Balance(wallet) {
    if (!this.#needToMigrateV5Balance) return;
    try {
      await wallet.load();
    } catch (err) {
      console.error(err);
    }
  }

  toggleHiddenBalance() {
    this.#clientStorage.toggleHiddenBalance();
    this.emit('update', 'isHiddenBalance');
  }

  async walletConnect() {
    if (!this.#walletConnect) {
      this.#walletConnect = import('./WalletConnect.js').then(({ WalletConnect }) => {
        return new WalletConnect({ account: this }).init();
      });
    }
    return this.#walletConnect;
  }

  unknownError() {
    if (this.isOnion && navigator.onLine) return i18n.global.t('Error! Please ensure that your Tor VPN is active.');
    return i18n.global.t('Error! Please try again later.');
  }
}
