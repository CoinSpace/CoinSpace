import { encrypt, decrypt } from 'lib/encryption';
import request from 'lib/request';

class Storage {
  constructor(baseURL, name, key) {
    this.name = name;
    this.baseURL = baseURL;
    this.url = `api/v3/storage/${name}`;
    this.key = key;
  }
  init() {
    this.pending = request({
      baseURL: this.baseURL,
      url: this.url,
      method: 'get',
      seed: 'public',
    }).then((res) => {
      if (res.data) {
        this.json = decrypt(res.data, this.key);
        this.storage = JSON.parse(this.json);
      } else {
        this.json = '{}';
        this.storage = {};
      }
    });
  }
  async get(key) {
    await this.pending;
    return this.storage[key];
  }
  async set(key, value) {
    this.pending = this.pending
      .then(async () => {
        this.storage[key] = value;
        const json = JSON.stringify(this.storage);
        if (json === this.json) {
          return;
        }
        const res = await request({
          baseURL: this.baseURL,
          url: this.url,
          method: 'put',
          data: {
            data: encrypt(json, this.key),
          },
          seed: 'public',
        });
        this.json = decrypt(res.data, this.key);
        this.storage = JSON.parse(this.json);
      });
    return this.pending;
  }
}

export default Storage;
