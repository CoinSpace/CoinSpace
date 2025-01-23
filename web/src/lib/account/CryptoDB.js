import { SUPPORTED_PLATFORMS } from '../constants.js';
import { deepFreeze } from '../helpers.js';

export default class CryptoDB {
  #request;
  #url = 'api/v4/cryptos';
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

  constructor({ request }) {
    if (!request) {
      throw new TypeError('request is required');
    }
    this.#request = request;
  }

  async init() {
    this.#db = await this.#request({
      url: this.#url,
      method: 'get',
      seed: 'device',
    });
    for (const item of this.#db) {
      item.supported = SUPPORTED_PLATFORMS.includes(item.platform);
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
