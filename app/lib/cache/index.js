'use strict';

const { encryptJSON, decryptJSON } = require('lib/encryption');
const request = require('lib/request');

class Cache {
  constructor(baseUrl, name, key) {
    this.url = `${baseUrl}api/v2/cache/${name}`;
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
      this.cache = decryptJSON(res.data, this.key);
    } else {
      this.cache = {};
    }
  }
  async get(key) {
    await this.pending;
    return this.cache[key];
  }
  async set(key, value) {
    // no await
    this.pending = this.pending
      .then(async () => {
        this.cache[key] = value;
        const res = await request({
          url: this.url,
          method: 'put',
          data: {
            data: encryptJSON(this.cache, this.key),
          },
          seed: 'public',
        });
        this.cache = decryptJSON(res.data, this.key);
      });
    return this.pending;
  }
}

module.exports = Cache;
