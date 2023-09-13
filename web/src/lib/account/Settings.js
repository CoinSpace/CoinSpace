export default class Settings {
  #request;
  #url = 'api/v4/settings';
  #storage;

  constructor({ request }) {
    if (!request) {
      throw new TypeError('request is required');
    }
    this.#request = request;
  }
  async init() {
    return this.#request({
      url: this.#url,
      method: 'get',
      seed: 'device',
    }).then((res) => {
      this.#storage = res;
    });
  }
  // sync get
  get(key) {
    if (key) {
      return this.#storage[key];
    }
    return this.#storage;
  }
  async set(key, value, seed) {
    const data = { [key]: value };
    await this.#request({
      url: this.#url,
      method: 'patch',
      data,
      seed,
    });
    this.#storage[key] = value;
  }

  clientSet(key, value) {
    this.#storage[key] = value;
  }
}
