import LS from './localStorage';
import seeds from './seeds';

export default class Cache {
  constructor(crypto) {
    this.data = {};
    if (LS.hasCache(crypto)) {
      this.data = LS.getCache(crypto, seeds.get('public'));
    } else {
      LS.setCache(crypto, this.data, seeds.get('public'));
    }
    this.crypto = crypto;
  }
  get(key) {
    return this.data[key];
  }
  set(key, value) {
    this.data[key] = value;
    LS.setCache(this.crypto, this.data, seeds.get('public'));
  }
}
