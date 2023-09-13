export default class Cache {
  #crypto;
  #clientStorage;
  #deviceSeed;
  #cache;

  constructor({ crypto, clientStorage, deviceSeed }) {
    if (!crypto) {
      throw new TypeError('crypto is required');
    }
    if (!clientStorage) {
      throw new TypeError('clientStorage is required');
    }
    if (!deviceSeed) {
      throw new TypeError('deviceSeed is required');
    }

    this.#crypto = crypto;
    this.#clientStorage = clientStorage;
    this.#cache = {};

    this.#deviceSeed = deviceSeed;

    if (this.#clientStorage.hasCache(this.#crypto)) {
      this.#cache = this.#clientStorage.getCache(this.#crypto, this.#deviceSeed);
    }
  }
  get(key) {
    return this.#cache[key];
  }
  set(key, value) {
    this.#cache[key] = value;
    this.#clientStorage.setCache(this.#crypto, this.#cache, this.#deviceSeed);
  }
}
