import ServerStorage from '../storage/ServerStorage.js';

export default class WalletStorage extends ServerStorage {
  constructor({ request, name, key }) {
    super({
      request,
      url: `api/v4/storage/${name}`,
      key,
    });
  }
}
