import encryption from '../encryption.js';
import { hex } from '@scure/base';

const STRING = Symbol('STRING');
const OBJECT = Symbol('OBJECT');
const BUFFER = Symbol('BUFFER'); // Uint8Array

export default class ClientStorage {
  #localStorage;

  constructor({ localStorage }) {
    this.#localStorage = localStorage;
  }

  #getItem(key, options) {
    const { token, type } = { type: STRING, ...options };
    let item = this.#localStorage.getItem(key);
    if (token) {
      if (!(token instanceof Uint8Array)) {
        throw new TypeError('token must be Uint8Array or Buffer');
      }
      item = encryption.decrypt(item, hex.encode(token));
    }
    if (type === STRING) {
      return item;
    } else if (type === BUFFER) {
      return hex.decode(item);
    } if (type === OBJECT) {
      return JSON.parse(item);
    }
  }
  #hasItem(key) {
    return !!this.#localStorage.getItem(key);
  }
  #setItem(key, value, options) {
    const { token, type } = { type: STRING, ...options };
    let item;
    if (type === STRING) {
      item = value;
    } else if (type === BUFFER) {
      if (!(value instanceof Uint8Array)) {
        throw new TypeError('value must be Uint8Array or Buffer');
      }
      item = hex.encode(value);
    } if (type === OBJECT) {
      item = JSON.stringify(value);
    }
    if (token) {
      if (!(token instanceof Uint8Array)) {
        throw new TypeError('token must be Uint8Array or Buffer');
      }
      item = encryption.encrypt(item, hex.encode(token));
    }
    this.#localStorage.setItem(key, item);
  }
  #unsetItem(key) {
    this.#localStorage.removeItem(key);
  }

  /**
   * Device ID
   */
  getId() {
    return this.#getItem('_cs_id');
  }
  hasId() {
    return this.#hasItem('_cs_id');
  }
  setId(id) {
    this.#setItem('_cs_id', id);
  }

  /**
   * PIN key
   */
  getPinKey() {
    return this.#getItem('_cs_pin_key', { type: BUFFER });
  }
  hasPinKey() {
    return this.#hasItem('_cs_pin_key');
  }
  setPinKey(pinKey) {
    this.#setItem('_cs_pin_key', pinKey, { type: BUFFER });
  }

  /**
   * Details key
   */
  getDetailsKey() {
    return this.#getItem('_cs_details_key', { type: BUFFER });
  }
  hasDetailsKey() {
    return this.#hasItem('_cs_details_key');
  }
  setDetailsKey(detailsKey) {
    this.#setItem('_cs_details_key', detailsKey, { type: BUFFER });
  }

  /**
   * Seeds
   */
  getSeed(type, token) {
    return this.#getItem(`_cs_seed_${type}`, { type: BUFFER, token });
  }
  hasSeed(type) {
    return this.#hasItem(`_cs_seed_${type}`);
  }
  setSeed(type, seed, token) {
    this.#setItem(`_cs_seed_${type}`, seed, { type: BUFFER, token });
  }

  /**
   * Cache
   */
  getCacheByKey(cacheKey, token) {
    return this.#getItem(`_cs_cache_${cacheKey}`, { type: OBJECT, token });
  }
  hasCacheByKey(cacheKey) {
    return this.#hasItem(`_cs_cache_${cacheKey}`);
  }
  setCacheByKey(cacheKey, cache, token) {
    this.#setItem(`_cs_cache_${cacheKey}`, cache, { type: OBJECT, token });
  }
  unsetCacheByKey(cacheKey) {
    this.#unsetItem(`_cs_cache_${cacheKey}`);
  }

  getCache(crypto, token) {
    return this.getCacheByKey(crypto._id, token);
  }
  hasCache(crypto) {
    return this.hasCacheByKey(crypto._id);
  }
  setCache(crypto, cache, token) {
    this.setCacheByKey(crypto._id, cache, token);
  }
  unsetCache(crypto) {
    this.unsetCacheByKey(crypto._id);
  }

  /**
   * Public key
   */
  #publicKeyKey(platform, index) {
    if (index === undefined || index === null) {
      return `_cs_public_key_${platform}`;
    }
    return `_cs_public_key_${platform}_${index}`;
  }

  getPublicKeyForInstance(platform, index, token) {
    // backward compatibility: instance 0 falls back to legacy per-platform key
    if (parseInt(index, 10) === 0 && !this.hasPublicKeyForInstance(platform, 0)) {
      return this.getPublicKey(platform, token);
    }
    return this.#getItem(this.#publicKeyKey(platform, index), { type: OBJECT, token });
  }
  hasPublicKeyForInstance(platform, index) {
    if (parseInt(index, 10) === 0) {
      return this.#hasItem(this.#publicKeyKey(platform, 0)) || this.hasPublicKey(platform);
    }
    return this.#hasItem(this.#publicKeyKey(platform, index));
  }
  setPublicKeyForInstance(platform, index, publicKey, token) {
    this.#setItem(this.#publicKeyKey(platform, index), publicKey, { type: OBJECT, token });
    // keep legacy key in sync for instance 0
    if (parseInt(index, 10) === 0) {
      this.setPublicKey(platform, publicKey, token);
    }
  }
  unsetPublicKeyForInstance(platform, index) {
    this.#unsetItem(this.#publicKeyKey(platform, index));
    if (parseInt(index, 10) === 0) {
      this.unsetPublicKey(platform);
    }
  }

  getPublicKey(platform, token) {
    return this.#getItem(`_cs_public_key_${platform}`, { type: OBJECT, token });
  }
  hasPublicKey(platform) {
    return this.#hasItem(`_cs_public_key_${platform}`);
  }
  setPublicKey(platform, publicKey, token) {
    this.#setItem(`_cs_public_key_${platform}`, publicKey, { type: OBJECT, token });
  }
  unsetPublicKey(platform) {
    this.#unsetItem(`_cs_public_key_${platform}`);
  }

  /**
   * Biometry
   */
  isBiometryEnabled() {
    return !!this.#getItem('_cs_biometry_enabled');
  }
  setBiometryEnabled(value) {
    if (!value) return this.#unsetItem('_cs_biometry_enabled');
    this.#setItem('_cs_biometry_enabled', value);
  }

  /**
   * Update
   */

  getUpdateShown() {
    return this.#getItem('_cs_update_shown');
  }

  setUpdateShown(value) {
    this.#setItem('_cs_update_shown', value);
  }

  /**
   * Protocol handler flag
   */

  hasProtocolHandler(scheme) {
    return this.#hasItem(`_cs_protocol_handler_${scheme}`);
  }

  setProtocolHandler(scheme) {
    this.#setItem(`_cs_protocol_handler_${scheme}`, 'registered');
  }

  /**
   * Hide/show balance
   */

  isHiddenBalance() {
    return !!this.#getItem('_cs_hidden_balance', { type: OBJECT });
  }

  toggleHiddenBalance() {
    this.#setItem('_cs_hidden_balance', !this.isHiddenBalance(), { type: OBJECT });
  }

  /**
   * Tor
   */

  isOnion() {
    return !!this.#getItem('_cs_onion', { type: OBJECT });
  }

  toggleOnion() {
    this.#setItem('_cs_onion', !this.isOnion(), { type: OBJECT });
  }


  /**
   * Clean All!
   */

  clear() {
    for (const key in this.#localStorage) {
      if (key && key.startsWith('_cs_')) {
        this.#localStorage.removeItem(key);
      }
    }
  }
}
