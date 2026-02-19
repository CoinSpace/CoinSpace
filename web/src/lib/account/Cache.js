export default class Cache {
  #crypto;
  #cacheKey;
  #clientStorage;
  #deviceSeed;
  #cache;

  constructor({ crypto, cacheKey, clientStorage, deviceSeed }) {
    if (!crypto && !cacheKey) {
      throw new TypeError('crypto or cacheKey is required');
    }
    if (!clientStorage) {
      throw new TypeError('clientStorage is required');
    }
    if (!deviceSeed) {
      throw new TypeError('deviceSeed is required');
    }

    this.#crypto = crypto;
    this.#cacheKey = cacheKey || crypto._id;
    this.#clientStorage = clientStorage;
    this.#cache = {};

    this.#deviceSeed = deviceSeed;

    if (this.#clientStorage.hasCacheByKey(this.#cacheKey)) {
      this.#cache = this.#clientStorage.getCacheByKey(this.#cacheKey, this.#deviceSeed);
    }
  }
  get(key) {
    return this.#cache[key];
  }
  set(key, value) {
    this.#cache[key] = value;
    this.#clientStorage.setCacheByKey(this.#cacheKey, this.#cache, this.#deviceSeed);
  }
}
