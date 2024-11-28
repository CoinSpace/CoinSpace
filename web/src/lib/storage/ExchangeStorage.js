import ServerStorage from './ServerStorage.js';

export default class ExchangeStorage extends ServerStorage {
  get defaults() {
    return {
      exchanges: [],
    };
  }

  constructor({ request, name, key }) {
    super({
      request,
      url: `api/v4/storage/${name}@exchange`,
      key,
    });
  }
}
