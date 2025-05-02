import { SUPPORTED_PLATFORMS } from '../constants.js';
import { deepFreeze } from '../helpers.js';
import femver from '@suchipi/femver';

export default class CryptoDB {
  #request;
  #db;

  get all() {
    return this.#db;
  }

  get coins() {
    return this.#db.filter((item) => item.type === 'coin');
  }

  get tokens() {
    return this.#db.filter((item) => item.type === 'token');
  }

  get new() {
    return this.#db.filter((item) => item.meta.new).toSorted((a, b) => a.meta.new - b.meta.new);
  }

  get popular() {
    return this.#db.filter((item) => item.meta.popular).toSorted((a, b) => a.meta.popular - b.meta.popular);
  }

  #isSupported(crypto) {
    if (crypto.supported === false) {
      return false;
    } else if (SUPPORTED_PLATFORMS.includes(crypto.platform)) {
      if (typeof crypto.supported === 'string' && femver.isValid(crypto.supported)) {
        return femver.gte(import.meta.env.VITE_VERSION, crypto.supported);
      }
      return true;
    }
    return false;
  }

  constructor({ request, account }) {
    if (!request) throw new TypeError('request is required');
    if (!account) throw new TypeError('account is required');
    this.#request = (config) => {
      return request({
        seed: 'device',
        ...config,
        baseURL: (account.isOnion
          ? import.meta.env.VITE_API_PRICE_URL_TOR
          : import.meta.env.VITE_API_PRICE_URL) + 'api/v1/',
      });
    };
  }

  async init() {
    this.#db = await this.#request({
      url: 'cryptos',
      method: 'get',
    });
    for (const item of this.#db) {
      item.supported = this.#isSupported(item);
      deepFreeze(item);
    }
  }

  get(id) {
    return this.#db.find((item) => item._id === id);
  }

  platform(platform) {
    return this.#db.find((item) => item.type === 'coin' && item.platform === platform);
  }

  platforms(platforms) {
    return this.#db.filter((item) => item.type === 'coin' && platforms.includes(item.platform));
  }

  getTokenByAddress(platform, address) {
    return this.#db
      .find((item) => item.type === 'token' && item.platform === platform && item.address === address);
  }
}
