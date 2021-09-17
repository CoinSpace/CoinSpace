import LS from './localStorage';
import seeds from './seeds';

export default class Cache {
  constructor(crypto) {
    this.cache = {};
    if (LS.hasCache(crypto)) {
      this.cache = LS.getCache(crypto, seeds.get('public'));
    } else {
      LS.setCache(crypto, this.cache, seeds.get('public'));
    }
    this.crypto = crypto;
  }
  get(key) {
    return this.cache[key];
  }
  set(key, value) {
    this.cache[key] = value;
    LS.setCache(this.crypto, this.cache, seeds.get('public'));
  }
}
