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

  static async initOne(account, crypto) {
    const storage = new WalletStorage({
      request: account.request,
      name: crypto._id,
      key: account.clientStorage.getDetailsKey(),
    });
    await storage.init();
    return storage;
  }

  static async initMany(account, cryptos = []) {
    const result = {};
    if (cryptos.length === 0) return result;

    const cryptoIds = cryptos.map((crypto) => crypto._id);
    const walletStorages = (await Promise.all(chunks(cryptoIds, 25).map((chunk) => {
      return account.request({
        url: `api/v4/storages/${chunk.join()}`,
        method: 'get',
        seed: 'device',
      });
    }))).flat();

    for (const cryptoId of cryptoIds) {
      const storage = new WalletStorage({
        request: account.request,
        name: cryptoId,
        key: account.clientStorage.getDetailsKey(),
      });
      const data = walletStorages.find((storage) => storage._id === cryptoId)?.data || null;
      await storage.init(data);
      result[cryptoId] = storage;
    }
    return result;
  }
}
