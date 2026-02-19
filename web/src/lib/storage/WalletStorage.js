import ServerStorage from './ServerStorage.js';
import { chunks } from '../helpers.js';

export default class WalletStorage extends ServerStorage {
  constructor({ request, name, key }) {
    super({
      request,
      url: `api/v4/storage/${name}`,
      key,
    });
  }

  static async initOneByName(account, name) {
    const storage = new WalletStorage({
      request: account.request,
      name,
      key: account.clientStorage.getDetailsKey(),
    });
    await storage.init();
    return storage;
  }

  static async initManyByNames(account, names = []) {
    const result = {};
    if (names.length === 0) return result;

    const walletStorages = (await Promise.all(chunks(names, 25).map((chunk) => {
      return account.request({
        url: `api/v4/storages/${chunk.join()}`,
        method: 'get',
        seed: 'device',
      });
    }))).flat();

    for (const name of names) {
      const storage = new WalletStorage({
        request: account.request,
        name,
        key: account.clientStorage.getDetailsKey(),
      });
      const data = walletStorages.find((storage) => storage._id === name)?.data || null;
      await storage.init(data);
      result[name] = storage;
    }
    return result;
  }

  static async initOne(account, crypto) {
    return this.initOneByName(account, crypto._id);
  }

  static async initMany(account, cryptos = []) {
    const result = {};
    if (cryptos.length === 0) return result;

    return this.initManyByNames(account, cryptos.map((crypto) => crypto._id));
  }
}
