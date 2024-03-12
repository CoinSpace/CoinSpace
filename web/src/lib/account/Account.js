import * as ed25519 from '@coinspace/ed25519';
import { EventEmitter } from 'events';
import { hex } from '@scure/base';
import { hmac } from '@noble/hashes/hmac';
import md5 from 'crypto-js/md5.js';
import { randomBytes } from '@noble/hashes/utils';
import { sha256 } from '@noble/hashes/sha256';
import { CsWallet, errors } from '@coinspace/cs-common';

import Biometry from './Biometry.js';
import Cache from './Cache.js';
import ChangellyExchange from './ChangellyExchange.js';
import ClientStorage from '../storage/ClientStorage.js';
import CryptoDB from './CryptoDB.js';
import Details from './Details.js';
import Hardware from './Hardware.js';
import Market from './Market.js';
import Mecto from './Mecto.js';
import Ramps from './Ramps.js';
import Request from './Request.js';
import Seeds from './Seeds.js';
import Settings from './Settings.js';
import WalletStorage from './WalletStorage.js';
import defaultCryptos from './defaultCryptos.js';

const BITCOIN_FAMILY = [
  'bitcoin',
  'bitcoin-cash',
  'litecoin',
  'dash',
  'dogecoin',
];

const EVM_FAMILY = [
  'ethereum',
  'ethereum-classic',
  'polygon',
  'avalanche-c-chain',
  'binance-smart-chain',
  'arbitrum',
];

async function loadWalletModule(platform) {
  if (BITCOIN_FAMILY.includes(platform)) {
    return (await import('@coinspace/cs-bitcoin-wallet')).default;
  }
  if (['solana'].includes(platform)) {
    return (await import('@coinspace/cs-solana-wallet')).default;
  }
  if (['monero'].includes(platform)) {
    return (await import('@coinspace/cs-monero-wallet')).default;
  }
  if (['tron'].includes(platform)) {
    return (await import('@coinspace/cs-tron-wallet')).default;
  }
  if (['cardano'].includes(platform)) {
    return (await import('@coinspace/cs-cardano-wallet')).default;
  }
  if (['ripple'].includes(platform)) {
    return (await import('@coinspace/cs-ripple-wallet')).default;
  }
  if (['stellar'].includes(platform)) {
    return (await import('@coinspace/cs-stellar-wallet')).default;
  }
  if (['eos'].includes(platform)) {
    return (await import('@coinspace/cs-eos-wallet')).default;
  }
  if (EVM_FAMILY.includes(platform)) {
    return (await import('@coinspace/cs-evm-wallet')).default;
  }
  if (['toncoin'].includes(platform)) {
    return (await import('@coinspace/cs-ton-wallet')).default;
  }
  // fallback
  return CsWallet;
}

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

  cryptos() {
    return [...this.#wallets.values()].map((item) => item.crypto);
  }
}

export default class Account extends EventEmitter {
  #clientStorage;
  #siteURL;
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
  #exchange;
  #needToMigrateV5Balance = false;

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

  get exchange() {
    return this.#exchange;
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

  get user() {
    if (this.#details) {
      const user = this.#details.get('userInfo');
      let avatar;
      if (user.email) {
        const hash = md5(user.email).toString();
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

  constructor({ siteURL, localStorage, release }) {
    super();
    if (!siteURL) {
      throw new TypeError('siteURL is required');
    }
    if (!localStorage) {
      throw new TypeError('localStorage is required');
    }

    this.#clientStorage = new ClientStorage({ localStorage });
    this.#siteURL = siteURL;
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

  async init() {
    await this.#settings.init();
    this.#details = new Details({
      request: this.request,
      key: this.#clientStorage.getDetailsKey(),
    });
    await this.#details.init();
    await this.#cryptoDB.init();
    this.emit('update', 'user');
    this.emit('update', 'language');
    this.emit('update', 'currency');
    this.emit('update', 'isHiddenBalance');

    this.#migrateV5Details();

    const cryptos = (this.#details.get('cryptos') || []).map((local) => {
      const remote = this.#cryptoDB.get(local._id);
      if (remote) {
        return remote;
      } else if (local.type === 'token') {
        const token = this.#cryptoDB.getTokenByAddress(local.platform, local.address);
        return token ? token : local;
      } else {
        return local;
      }
    });
    cryptos.forEach((crypto) => {
      if (crypto.type === 'token') {
        const platform = cryptos.find((item) => item.type === 'coin' && item.platform === crypto.platform);
        if (!platform) cryptos.push(this.#cryptoDB.platform(crypto.platform));
      }
    });
    this.#details.set('cryptos', cryptos);
    await this.#details.save();

    await this.#market.init({
      cryptos,
      currency: this.#details.get('systemInfo').preferredCurrency,
    });
    this.#exchange = new ChangellyExchange({
      request: this.request,
      account: this,
    });
    await this.#exchange.init();
  }

  /**
   * 1. Initial launch by passphrase
   * 2. Enter by passphare
   * 3. Add new crypto
   */
  async #createWallet(crypto, walletSeed, settings) {
    const Wallet = await loadWalletModule(crypto.platform);
    const platform = this.#cryptoDB.platform(crypto.platform);
    const options = await this.#getWalletOptions(crypto, platform, settings);
    const wallet = new Wallet(options);
    await wallet.create(walletSeed);
    return wallet;
  }

  /**
   * 1. Enter by pin
   */
  async #openWallet(crypto, settings) {
    const Wallet = await loadWalletModule(crypto.platform);
    const platform = this.#cryptoDB.platform(crypto.platform);
    const options = await this.#getWalletOptions(crypto, platform, settings);
    const wallet = new Wallet(options);
    if (this.#clientStorage.hasPublicKey(crypto.platform)) {
      await wallet.open(this.#clientStorage.getPublicKey(crypto.platform, this.#deviceSeed));
    } else {
      wallet.state = CsWallet.STATE_NEED_INITIALIZATION;
    }
    return wallet;
  }

  #getApiNode(platform) {
    switch (platform) {
      // Bitcoin-like
      case 'bitcoin':
        return import.meta.env.VITE_API_BTC_URL;
      case 'bitcoin-cash':
        return import.meta.env.VITE_API_BCH_URL;
      case 'dash':
        return import.meta.env.VITE_API_DASH_URL;
      case 'dogecoin':
        return import.meta.env.VITE_API_DOGE_URL;
      case 'litecoin':
        return import.meta.env.VITE_API_LTC_URL;
      // Ethereum-like
      case 'ethereum':
        return import.meta.env.VITE_API_ETH_URL;
      case 'ethereum-classic':
        return import.meta.env.VITE_API_ETC_URL;
      case 'binance-smart-chain':
        return import.meta.env.VITE_API_BSC_URL;
      case 'polygon':
        return import.meta.env.VITE_API_POLYGON_URL;
      case 'avalanche-c-chain':
        return import.meta.env.VITE_API_AVAX_URL;
      case 'arbitrum':
        return import.meta.env.VITE_API_ARB_URL;
      // Ripple-like
      case 'ripple':
        return import.meta.env.VITE_API_XRP_URL;
      case 'stellar':
        return import.meta.env.VITE_API_XLM_URL;
      // Others
      case 'monero':
        return import.meta.env.VITE_API_XMR_URL;
      case 'eos':
        return import.meta.env.VITE_API_EOS_URL;
      case 'solana':
        return import.meta.env.VITE_API_SOL_URL;
      case 'tron':
        return import.meta.env.VITE_API_TRX_URL;
      case 'cardano':
        return import.meta.env.VITE_API_ADA_URL;
      case 'toncoin':
        return import.meta.env.VITE_API_TON_URL;
      default:
        throw new errors.InternalWalletError(`Unsupported platform "${platform}"`);
    }
  }

  async #getWalletOptions(crypto, platform, settings) {
    const cache = new Cache({
      crypto,
      clientStorage: this.#clientStorage,
      deviceSeed: this.#deviceSeed,
    });
    const storage = new WalletStorage({
      request: this.request,
      name: crypto._id,
      key: this.#clientStorage.getDetailsKey(),
    });
    await storage.init();
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
    if (info?.name && info?.symbol && info?.decimals) {
      return {
        _id: `${address}@${platform}`,
        platform,
        type: 'token',
        name: info.name,
        symbol: info.symbol,
        address,
        decimals: parseInt(info.decimals, 10),
      };
    } else {
      throw new errors.AddressError(`Invalid token address ${address}`);
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

    await this.init();

    const wallets = await Promise.all(this.#details.get('cryptos').map(async (crypto) => {
      const wallet = await this.#createWallet(crypto, walletSeed);
      // save public key only for coins
      if (crypto.type === 'coin') {
        this.#clientStorage.setPublicKey(crypto.platform, wallet.getPublicKey(), deviceSeed);
        this.#details.setPlatformSettings(crypto.platform, wallet.settings);
      }
      await this.#migrateV5Balance(wallet);
      return wallet;
    }));
    this.#wallets.setMany(wallets);
    await this.#details.save();
    this.emit('update');
  }

  async open(deviceSeed) {
    this.#deviceSeed = deviceSeed;
    await this.init();
    const wallets = await Promise.all(this.#details.get('cryptos').map(async (crypto) => {
      const wallet = await this.#openWallet(crypto);
      if (crypto.type === 'coin') {
        this.#details.setPlatformSettings(crypto.platform, wallet.settings);
      }
      return wallet;
    }));
    this.#wallets.setMany(wallets);
    await this.#details.save();
    this.emit('update');
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
    if (this.#wallets.has(crypto._id)) {
      throw new CryptoAlreadyAddedError(crypto._id);
    }
    if (this.#clientStorage.hasPublicKey(crypto.platform)) {
      this.#wallets.set(await this.#openWallet(crypto));
    } else if (walletSeed) {
      if (crypto.type === 'coin') {
        const wallet = await this.#createWallet(crypto, walletSeed);
        this.#wallets.set(wallet);
        this.#details.setPlatformSettings(crypto.platform, wallet.settings);
        this.#clientStorage.setPublicKey(wallet.crypto.platform, wallet.getPublicKey(), this.#deviceSeed);
      }
      if (crypto.type === 'token') {
        const platform = this.#cryptoDB.platform(crypto.platform);
        const wallet = await this.#createWallet(platform, walletSeed);
        this.#wallets.set(wallet);
        this.#details.setPlatformSettings(crypto.platform, wallet.settings);
        this.#clientStorage.setPublicKey(wallet.crypto.platform, wallet.getPublicKey(), this.#deviceSeed);
        this.#wallets.set(await this.#openWallet(crypto));
      }
    } else {
      throw new SeedRequiredError();
    }

    this.#details.set('cryptos', this.#wallets.cryptos());
    await this.#details.save();
    this.emit('update');
  }

  async removeWallet(crypto) {
    if (crypto.type === 'coin') {
      const wallets = this.#wallets.filterByPlatform(crypto.platform);
      for (const wallet of wallets) {
        this.#wallets.delete(wallet.crypto._id);
      }
      this.#clientStorage.unsetPublicKey(crypto.platform);
    } else if (crypto.type === 'token') {
      this.#wallets.delete(crypto._id);
    }

    this.#details.set('cryptos', this.#wallets.cryptos());
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

  async updatePlatformSettings(crypto, settings, walletSeed) {
    const { platform } = crypto;
    const platformWallets = this.#wallets.filterByPlatform(platform);
    platformWallets.forEach((item) => item.cleanup());

    const wallet = await this.#createWallet(crypto, walletSeed, settings);
    this.#wallets.set(wallet);
    this.#clientStorage.setPublicKey(platform, wallet.getPublicKey(), this.#deviceSeed);

    for (const item of platformWallets) {
      if (item !== wallet) {
        this.#wallets.set(await this.#openWallet(item.crypto, settings));
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
      baseURL: this.#siteURL,
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

  #migrateV5Details() {
    const cryptoSettings = this.#details.get('cryptoSettings');
    if (cryptoSettings) {
      const platformSettings = Object.keys(cryptoSettings).reduce((result, id) => {
        const crypto = this.#cryptoDB.get(id);
        if (crypto) result[crypto.platform] = cryptoSettings[id];
        return result;
      }, {});
      const legacy = {
        'ethereum@ethereum': { bip44: 'm' },
        'binance-coin@binance-smart-chain': { bip44: "m/44'/714'/0'" },
        'bitcoin@bitcoin': {
          bip84: "m/84'/0'/0'",
          bip49: "m/49'/0'/0'",
          bip44: "m/0'",
        },
        'litecoin@litecoin': {
          bip84: "m/84'/2'/0'",
          bip49: "m/49'/2'/0'",
          bip44: "m/0'",
        },
        'bitcoin-cash@bitcoin-cash': { bip44: "m/0'" },
        'dogecoin@dogecoin': { bip44: "m/0'" },
        'dash@dash': { bip44: "m/0'" },
      };
      Object.keys(legacy).forEach((id) => {
        const crypto = this.#cryptoDB.get(id);
        if (crypto && !platformSettings[crypto.platform]) {
          platformSettings[crypto.platform] = legacy[id];
        }
      });
      this.#details.set('platformSettings', platformSettings);
      this.#details.delete('cryptoSettings');
    }
    const tokens = this.#details.get('tokens');
    if (tokens) {
      this.#needToMigrateV5Balance = true;
      const cryptos = [
        ...defaultCryptos,
        ...tokens.filter((crypto) => {
          return crypto?._id?.includes('@') && !defaultCryptos.find((token) => token._id === crypto._id);
        }),
      ];
      this.#details.set('cryptos', cryptos);
      this.#details.delete('tokens');
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
}
