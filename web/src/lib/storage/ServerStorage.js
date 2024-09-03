import { hex } from '@scure/base';
import stringify from 'fast-json-stable-stringify';
import { decrypt, encrypt } from '../encryption.js';

export default class ServerStorage {
  #status = undefined;
  #request;
  #url;
  #key;
  #storage;
  #json;

  constructor({ request, url, key }) {
    if (!request) {
      throw new TypeError('request is required');
    }
    if (!url) {
      throw new TypeError('url is required');
    }
    if (!key) {
      throw new TypeError('key is required');
    }
    if (!(key instanceof Uint8Array)) {
      throw new TypeError('key must be Uint8Array or Buffer');
    }
    this.#request = request;
    this.#url = url;
    this.#key = hex.encode(key);
  }

  get defaults() {
    return {};
  }

  async init(data) {
    if (this.#status !== undefined) {
      throw new Error('ServerStorage already initialized');
    }
    this.#status = 'initializing';
    if (data === undefined) {
      ({ data } = await this.#request({
        url: this.#url,
        method: 'get',
        seed: 'device',
      }));
    }
    if (data) {
      this.#json = decrypt(data, this.#key);
      this.#storage = JSON.parse(this.#json);
    } else {
      this.#storage = this.defaults;
      this.#json = stringify(this.#storage);
      // We don't save default data
    }
    this.#status = 'ready';
  }

  async save() {
    if (this.#status !== 'ready') {
      throw new Error('ServerStorage not ready');
    }
    const json = stringify(this.#storage);
    if (json === this.#json) {
      return;
    }
    this.#status = 'saving';
    const { data } = await this.#request({
      url: this.#url,
      method: 'put',
      data: {
        data: encrypt(json, this.#key),
      },
      seed: 'device',
    });
    this.#json = decrypt(data, this.#key);
    this.#storage = JSON.parse(this.#json);
    this.#status = 'ready';
  }

  get(key) {
    if (this.#status !== 'ready') {
      throw new Error('ServerStorage not ready');
    }
    if (key === undefined) {
      throw new TypeError('key must be set');
    }
    return this.#storage[key];
  }

  set(key, value) {
    if (this.#status !== 'ready') {
      throw new Error('ServerStorage not ready');
    }
    if (key === undefined) {
      throw new TypeError('key must be set');
    }
    this.#storage[key] = value;
  }

  delete(key) {
    if (key === undefined) {
      throw new TypeError('key must be set');
    }
    delete this.#storage[key];
  }
}
