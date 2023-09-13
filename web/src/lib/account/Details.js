import ServerStorage from '../storage/ServerStorage.js';
import defaultCryptos from './defaultCryptos.js';

export default class Details extends ServerStorage {
  constructor({ request, key }) {
    super({
      request,
      url: 'api/v4/details',
      key,
    });
  }

  get defaults() {
    return {
      systemInfo: { preferredCurrency: 'USD' },
      userInfo: {
        username: '',
        email: '',
      },
      cryptos: defaultCryptos,
    };
  }

  getPlatformSettings(key) {
    if (!key) {
      throw new TypeError('settings key must be specified');
    }
    const settings = this.get('platformSettings') || {};
    return settings[key] || {};
  }

  setPlatformSettings(key, value) {
    if (!key) {
      throw new TypeError('settings key must be specified');
    }
    const settings = this.get('platformSettings') || {};
    return this.set('platformSettings', {
      ...settings,
      [key]: value,
    });
  }
}
