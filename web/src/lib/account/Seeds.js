export default class Seeds {
  #clientStorage;

  constructor({ clientStorage }) {
    if (!clientStorage) {
      throw new TypeError('clientStorage is required');
    }
    this.#clientStorage = clientStorage;
  }

  // public -> device
  // private -> wallet
  get(type, token) {
    if (!['device', 'wallet'].includes(type)) {
      throw new TypeError(`Wrong seed type '${type}'`);
    }
    return this.#clientStorage.getSeed(type, token);
  }

  set(type, seed, token) {
    if (!(seed instanceof Uint8Array)) {
      throw new TypeError('seed must be Uint8Array or Buffer');
    }
    if (!['device', 'wallet'].includes(type)) {
      throw new TypeError(`Wrong seed type '${type}'`);
    }
    return this.#clientStorage.setSeed(type, seed, token);
  }
}
