import ServerStorage from './ServerStorage.js';
import { chunks } from '../helpers.js';

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

  static async initMany(account, exchanges = []) {
    const result = {};
    if (exchanges.length === 0) return result;

    const suffix = '@exchange';
    const exchangeIds = exchanges.map((exchange) => `${exchange.id}${suffix}`);
    const exchangeStorages = (await Promise.all(chunks(exchangeIds, 25).map((chunk) => {
      return account.request({
        url: `api/v4/storages/${chunk.join()}`,
        method: 'get',
        seed: 'device',
      });
    }))).flat();

    for (const exchange of exchanges) {
      const storage = new ExchangeStorage({
        request: account.request,
        name: exchange.id,
        key: account.clientStorage.getDetailsKey(),
      });
      const id = `${exchange.id}${suffix}`;
      const data = exchangeStorages.find((storage) => storage._id === id)?.data || null;
      await storage.init(data);
      result[exchange.id] = storage;
    }
    return result;
  }
}
