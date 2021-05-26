import { encryptJSON, decryptJSON } from 'lib/encryption';
import request from 'lib/request';

class Storage {
  constructor(baseUrl, name, key) {
    this.url = `${baseUrl}api/v2/storage/${name}`;
    this.key = key;
    // no await
    this.pending = this.init();
  }
  async init() {
    const res = await request({
      url: this.url,
      method: 'get',
      seed: 'public',
    });
    if (res.data) {
      this.storage = decryptJSON(res.data, this.key);
    } else {
      this.storage = {};
    }
  }
  async get(key) {
    await this.pending;
    return this.storage[key];
  }
  async set(key, value) {
    // no await
    this.pending = this.pending
      .then(async () => {
        this.storage[key] = value;
        const res = await request({
          url: this.url,
          method: 'put',
          data: {
            data: encryptJSON(this.storage, this.key),
          },
          seed: 'public',
        });
        this.storage = decryptJSON(res.data, this.key);
      });
    return this.pending;
  }
}

export default Storage;
