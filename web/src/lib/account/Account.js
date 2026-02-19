import { EventEmitter } from 'events';
import { ed25519 } from '@noble/curves/ed25519';
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
  deriveTronKeypair,
  instanceCacheKey,
  instanceStorageName,
  tronBip44,
} from '../tronInstances.js';
import {
  EVM_FAMILY,
  getApiNode,
  getBaseURL,
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

  set(wallet, walletId = wallet.crypto._id) {
    this.#wallets.set(walletId, wallet);
  }

  setMany(wallets = []) {
    wallets.forEach(({ wallet, walletId }) => this.set(wallet, walletId));
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
  #cryptosToSelect = undefined;

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

  get cryptosToSelect() {
    return this.#cryptosToSelect;
  }

  get walletsNeedSynchronization() {
    return this.wallets('coin').filter((wallet) => {
      return wallet.state === CsWallet.STATE_NEED_INITIALIZATION;
    });
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
      account: this,
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
      account: this,
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

    const walletId = hex.encode(await ed25519.getPublicKey(walletSeed, false));
    const deviceSeed = randomBytes(32);
    const deviceId = hex.encode(await ed25519.getPublicKey(deviceSeed));
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
    await this.#initWalletsFromDetails(walletSeed);
  }

  async open(deviceSeed) {
    this.#deviceSeed = deviceSeed;
    await this.#init();
    await this.#initWalletsFromDetails();
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

    await this.#initMarket();
    this.#exchanges = new Exchanges({
      request: this.request,
      account: this,
    });
    await this.#exchanges.init();
    this.#dummy = hex.encode(this.#clientStorage.getDetailsKey())
      === import.meta.env.VITE_DUMMY_ACCOUNT;

    this.#initCryptosToSelect();
  }

  #initCryptosToSelect() {
    let cryptos = [];
    let type;
    if (this.#details.get('cryptos') === undefined) {
      type = 'popular';
      cryptos = this.#cryptoDB.popular.filter((item) => item.supported && !item.deprecated);
    } else {
      type = 'new';
      cryptos = this.#details.getNewCryptos();
    }
    if (cryptos.length) {
      this.#cryptosToSelect = { type, cryptos };
    }
  }

  async #initWalletsFromDetails(walletSeed = undefined) {
    const cryptos = this.#details.getSupportedCryptos();
    const selectedTronIndex = this.#details.getSelectedPlatformInstanceIndex('tron');

    // If we have the wallet seed (fresh restore), materialize public keys for all Tron instances.
    // This keeps multi-account Tron consistent across browsers/devices without storing keys on server.
    if (walletSeed) {
      const tronInstances = this.#details.getPlatformInstances('tron');
      for (const item of tronInstances.items || []) {
        const index = item.index;
        if (!Number.isInteger(index)) continue;
        if (this.#clientStorage.hasPublicKeyForInstance('tron', index)) continue;
        const bip44 = item.bip44 || tronBip44(index);
        const { publicKey } = deriveTronKeypair({ seed: walletSeed, bip44Path: bip44 });
        this.#clientStorage.setPublicKeyForInstance('tron', index, {
          settings: { bip44 },
          data: publicKey,
        }, this.#deviceSeed);
      }
    }

    // only initialize selected tron instance to avoid exploding wallet objects (e.g., 100 instances)
    const initList = cryptos.map((crypto) => {
      if (crypto.platform === 'tron') {
        return { crypto, instanceIndex: selectedTronIndex };
      }
      return { crypto, instanceIndex: undefined };
    });

    const storageNames = initList.map(({ crypto, instanceIndex }) => {
      return this.#storageNameFor(crypto, instanceIndex);
    });
    const walletStorages = await WalletStorage.initManyByNames(this, storageNames);

    const wallets = await Promise.all(initList.map(async ({ crypto, instanceIndex }) => {
      const storageName = this.#storageNameFor(crypto, instanceIndex);
      const wallet = await this.#createWallet({
        crypto,
        walletStorage: walletStorages[storageName],
        instanceIndex,
      }, walletSeed);

      if (crypto.type === 'coin') {
        if (wallet.state === CsWallet.STATE_INITIALIZED) {
          if (crypto.platform === 'tron' && Number.isInteger(instanceIndex)) {
            this.#clientStorage.setPublicKeyForInstance(crypto.platform, instanceIndex, wallet.getPublicKey(), this.#deviceSeed);
          } else {
            this.#clientStorage.setPublicKey(crypto.platform, wallet.getPublicKey(), this.#deviceSeed);
          }
        }
        this.#details.setPlatformSettings(crypto.platform, wallet.settings);
      }
      if (this.#details.needToMigrateV5Balance) {
        await this.#migrateV5Balance(wallet);
      }
      return { wallet, walletId: this.#walletIdFor(crypto, instanceIndex) };
    }));
    this.#wallets.setMany(wallets);

    await this.#details.save();
    this.emit('update');
  }

  #walletIdFor(crypto, instanceIndex) {
    if (crypto.platform === 'tron' && Number.isInteger(instanceIndex)) {
      return `${crypto._id}#${instanceIndex}`;
    }
    return crypto._id;
  }

  #storageNameFor(crypto, instanceIndex) {
    if (crypto.platform === 'tron' && Number.isInteger(instanceIndex)) {
      return instanceStorageName(crypto._id, instanceIndex);
    }
    return crypto._id;
  }

  #cacheKeyFor(crypto, instanceIndex) {
    if (crypto.platform === 'tron' && Number.isInteger(instanceIndex)) {
      return instanceCacheKey(crypto._id, instanceIndex);
    }
    return crypto._id;
  }

  #settingsFor(crypto, settings, instanceIndex) {
    const base = settings || this.#details.getPlatformSettings(crypto.platform);
    if (crypto.platform !== 'tron' || !Number.isInteger(instanceIndex)) {
      return base;
    }
    const tronInstances = this.#details.getPlatformInstances('tron');
    const item = tronInstances.items?.find((it) => it.index === instanceIndex);
    const bip44 = item?.bip44 || tronBip44(instanceIndex);
    return {
      ...base,
      bip44,
    };
  }

  async #createWallet({ crypto, walletStorage, settings, instanceIndex }, walletSeed) {
    const Wallet = await loadWalletModule(crypto.platform);
    const platform = this.#cryptoDB.platform(crypto.platform);
    const options = this.#getWalletOptions(crypto, platform, walletStorage, settings, instanceIndex);
    const wallet = new Wallet(options);
    if (crypto.platform === 'tron' && Number.isInteger(instanceIndex)) {
      wallet.instanceIndex = instanceIndex;
    }
    if (walletSeed) {
      await wallet.create(walletSeed);
    } else if (crypto.platform === 'tron' && Number.isInteger(instanceIndex) && this.#clientStorage.hasPublicKeyForInstance(crypto.platform, instanceIndex)) {
      await wallet.open(this.#clientStorage.getPublicKeyForInstance(crypto.platform, instanceIndex, this.#deviceSeed));
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

  getBaseURL(service) {
    return getBaseURL(service, this.isOnion);
  }

  #getWalletOptions(crypto, platform, storage, settings, instanceIndex) {
    const cache = new Cache({
      crypto,
      cacheKey: this.#cacheKeyFor(crypto, instanceIndex),
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
      settings: this.#settingsFor(crypto, settings, instanceIndex),
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
    const Wallet = await loadWalletModule(platform);
    const info = await this.request({
      baseURL: this.#getApiNode(platform),
      url: Wallet.tokenApiUrl(address),
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
    const crypto = this.#cryptoDB.get(id);
    if (crypto?.platform === 'tron') {
      const index = this.#details.getSelectedPlatformInstanceIndex('tron');
      return this.#wallets.get(this.#walletIdFor(crypto, index));
    }
    return this.#wallets.get(id);
  }

  walletInstance(id, instanceIndex) {
    const crypto = this.#cryptoDB.get(id);
    if (!crypto) return undefined;
    if (crypto.platform !== 'tron' || !Number.isInteger(parseInt(instanceIndex, 10))) {
      return this.#wallets.get(id);
    }
    return this.#wallets.get(this.#walletIdFor(crypto, parseInt(instanceIndex, 10)));
  }

  async getOrCreateWalletInstance(id, instanceIndex) {
    const crypto = this.#cryptoDB.get(id);
    if (!crypto) return undefined;
    if (crypto.platform !== 'tron') {
      return this.wallet(id);
    }
    const index = Number.isInteger(parseInt(instanceIndex, 10))
      ? parseInt(instanceIndex, 10)
      : this.#details.getSelectedPlatformInstanceIndex('tron');

    const walletId = this.#walletIdFor(crypto, index);
    if (this.#wallets.has(walletId)) {
      return this.#wallets.get(walletId);
    }

    const storageName = this.#storageNameFor(crypto, index);
    const walletStorage = await WalletStorage.initOneByName(this, storageName);
    const wallet = await this.#createWallet({
      crypto,
      walletStorage,
      instanceIndex: index,
    });
    this.#wallets.set(wallet, walletId);
    return wallet;
  }

  async ensureTronInstances(count, walletSeed) {
    const target = Math.max(0, parseInt(count, 10) || 0);
    if (target <= 0) return;

    const tronCrypto = this.#cryptoDB.get('tron@tron');
    if (!tronCrypto) {
      throw new Error('tron@tron crypto not found');
    }

    // ensure asset is present in wallet
    if (!this.#details.hasCrypto(tronCrypto)) {
      this.#details.addCrypto(tronCrypto);
    }

    const instances = this.#details.getPlatformInstances('tron');
    const current = instances.items?.length || 0;
    if (current >= target) return;

    if (!walletSeed) {
      throw new SeedRequiredError();
    }

    // make sure instances list exists with correct bip44 paths
    this.#details.ensurePlatformInstances('tron', target, {
      bip44Factory: tronBip44,
      labelFactory: (i) => `Account ${i + 1}`,
    });

    const updated = this.#details.getPlatformInstances('tron');
    for (const item of updated.items) {
      if (!item?.bip44) continue;
      if (this.#clientStorage.hasPublicKeyForInstance('tron', item.index)) continue;

      const { publicKey } = deriveTronKeypair({ seed: walletSeed, bip44Path: item.bip44 });
      this.#clientStorage.setPublicKeyForInstance('tron', item.index, {
        settings: { bip44: item.bip44 },
        data: publicKey,
      }, this.#deviceSeed);
    }

    await this.#details.save();
    this.emit('update');
  }

  wallets(type = '') {
    // Visible wallets list: one item per crypto._id.
    // For Tron multi-instances we expose only the currently selected instance.
    const cryptos = this.#details?.getSupportedCryptos?.() || [];
    const result = [];
    for (const crypto of cryptos) {
      const wallet = this.wallet(crypto._id);
      if (!wallet) continue;
      if (type && wallet.crypto.type !== type) continue;
      result.push(wallet);
    }
    return result;
  }

  walletsAll(type = '') {
    if (type) return this.#wallets.filterByType(type);
    return this.#wallets.list();
  }

  tokensByPlatform(platform) {
    return this.wallets().filter((wallet) => {
      return wallet.crypto.platform === platform && wallet.crypto.type === 'token';
    });
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

  async addWallet(crypto, walletSeed) {
    if (this.#details.hasCrypto(crypto)) {
      throw new CryptoAlreadyAddedError(crypto._id);
    }
    await this.#addWallet(crypto, walletSeed);
    await this.#initMarket();
    await this.#details.save();
    this.emit('update');
  }

  async addWallets(cryptos, walletSeed) {
    for (const crypto of cryptos) {
      if (this.#details.hasCrypto(crypto)) continue;
      await this.#addWallet(crypto, walletSeed);
    }
    await this.#initMarket();
    await this.#details.save();
    this.emit('update');
  }

  /**
   * Adding a new wallet to the account.
   * If there is a public key, then unlocking the private seed is not requested.
   */
  async #addWallet(crypto, walletSeed) {
    if (this.#clientStorage.hasPublicKey(crypto.platform)) {
      const walletStorage = await WalletStorage.initOne(this, crypto);
      const wallet = await this.#createWallet({ crypto, walletStorage });
      this.#wallets.set(wallet, this.#walletIdFor(crypto));
      this.#details.addCrypto(crypto);
    } else if (walletSeed) {
      if (crypto.type === 'coin') {
        const walletStorage = await WalletStorage.initOne(this, crypto);
        const wallet = await this.#createWallet({
          crypto,
          walletStorage,
        }, walletSeed);
        this.#wallets.set(wallet, this.#walletIdFor(crypto));
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
        this.#wallets.set(wallet, this.#walletIdFor(platform));
        this.#details.setPlatformSettings(crypto.platform, wallet.settings);
        this.#clientStorage.setPublicKey(wallet.crypto.platform, wallet.getPublicKey(), this.#deviceSeed);
        const tokenWallet = await this.#createWallet({
          crypto,
          walletStorage: walletStorages[crypto._id],
        });
        this.#wallets.set(tokenWallet, this.#walletIdFor(crypto));
        this.#details.addCrypto(platform);
        this.#details.addCrypto(crypto);
      }
    } else {
      throw new SeedRequiredError();
    }
  }

  async #initMarket() {
    await this.#market.init({
      cryptos: this.#details.getSupportedCryptos(),
      currency: this.#details.get('systemInfo').preferredCurrency,
    });
  }

  async removeWallet(crypto) {
    if (crypto.type === 'coin') {
      const wallets = this.#wallets.filterByPlatform(crypto.platform);
      const instanceIndexes = new Set();
      for (const wallet of wallets) {
        this.#wallets.delete(this.#walletIdFor(wallet.crypto, wallet.instanceIndex));
        this.#details.removeCrypto(wallet.crypto);
        if (crypto.platform === 'tron' && Number.isInteger(wallet.instanceIndex)) {
          instanceIndexes.add(wallet.instanceIndex);
        }
      }
      if (crypto.platform === 'tron') {
        const tronInstances = this.#details.getPlatformInstances('tron');
        const allIndexes = (tronInstances.items || []).map((i) => i.index);
        for (const index of new Set([...allIndexes, ...instanceIndexes])) {
          this.#clientStorage.unsetPublicKeyForInstance('tron', index);
        }
        const platformInstances = this.#details.get('platformInstances') || {};
        delete platformInstances.tron;
        this.#details.set('platformInstances', platformInstances);
      } else {
        this.#clientStorage.unsetPublicKey(crypto.platform);
      }
    } else if (crypto.type === 'token') {
      if (crypto.platform === 'tron') {
        const wallets = this.#wallets.list().filter((w) => w.crypto._id === crypto._id);
        for (const wallet of wallets) {
          this.#wallets.delete(this.#walletIdFor(wallet.crypto, wallet.instanceIndex));
        }
      } else {
        this.#wallets.delete(crypto._id);
      }
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
        if (wallet.crypto.platform === 'tron') {
          // Each Tron instance has its own bip44/public key.
          if (Number.isInteger(wallet.instanceIndex) && item.instanceIndex !== wallet.instanceIndex) {
            continue;
          }
        }
        await item.open(publicKey);
      }
    }
    if (wallet.crypto.platform === 'tron' && Number.isInteger(wallet.instanceIndex)) {
      this.#clientStorage.setPublicKeyForInstance('tron', wallet.instanceIndex, publicKey, this.#deviceSeed);
    } else {
      this.#clientStorage.setPublicKey(wallet.crypto.platform, publicKey, this.#deviceSeed);
    }
  }

  async initWallets(wallets, walletSeed) {
    for (const wallet of wallets) {
      await this.initWallet(wallet, walletSeed);
    }
    this.emit('update');
  }

  async updatePlatformSettings(wallet, settings, walletSeed) {
    const { platform } = wallet.crypto;
    const platformWallets = this.#wallets.filterByPlatform(platform);
    platformWallets.forEach((item) => item.cleanup());
    wallet.settings = settings;
    await wallet.create(walletSeed);
    const publicKey = wallet.getPublicKey();
    if (platform === 'tron' && Number.isInteger(wallet.instanceIndex)) {
      this.#clientStorage.setPublicKeyForInstance('tron', wallet.instanceIndex, publicKey, this.#deviceSeed);
    } else {
      this.#clientStorage.setPublicKey(platform, publicKey, this.#deviceSeed);
    }
    for (const platformWallet of platformWallets) {
      if (wallet !== platformWallet) {
        if (platform === 'tron') {
          if (Number.isInteger(wallet.instanceIndex) && platformWallet.instanceIndex !== wallet.instanceIndex) {
            continue;
          }
        }
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

  async getInvitationStatus() {
    return this.request({
      url: '/api/v4/invitation',
      method: 'get',
      seed: this.#deviceSeed,
    });
  }

  async sendInvitation(email) {
    return this.request({
      url: '/api/v4/invitation',
      method: 'post',
      seed: this.#deviceSeed,
      data: { email },
    });
  }

  unknownError() {
    if (this.isOnion && navigator.onLine) return i18n.global.t('Error! Please ensure that your Tor VPN is active.');
    return i18n.global.t('Error! Please try again later.');
  }
}
