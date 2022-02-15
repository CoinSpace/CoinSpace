import _ from 'lodash';
import { encrypt, decrypt } from 'lib/encryption';
import request from 'lib/request';
import LS from './localStorage';
import tetherToken from '@coinspace/crypto-db/crypto/tether@ethereum.json';
import CsWallet from '@coinspace/cs-wallet';

class Details {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.url = 'api/v3/details';
  }
  get key() {
    return LS.getDetailsKey();
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
        // defaults
        return this.#save(JSON.stringify({
          systemInfo: { preferredCurrency: 'USD' },
          userInfo: {
            username: '',
            email: '',
          },
          tokens: [
            tetherToken,
          ],
          cryptoSettings: {
            'bitcoin@bitcoin': {
              bip44: CsWallet.networks.bitcoin.bip44,
              bip49: CsWallet.networks.bitcoin.bip49,
              bip84: CsWallet.networks.bitcoin.bip84,
            },
            'bitcoin-cash@bitcoin-cash': {
              bip44: CsWallet.networks['bitcoin-cash'].bip44,
            },
            'bitcoin-sv@bitcoin-sv': {
              bip44: CsWallet.networks['bitcoin-sv'].bip44,
            },
            'litecoin@litecoin': {
              bip44: CsWallet.networks.litecoin.bip44,
              bip49: CsWallet.networks.litecoin.bip49,
              bip84: CsWallet.networks.litecoin.bip84,
            },
            'dogecoin@dogecoin': {
              bip44: CsWallet.networks.dogecoin.bip44,
            },
            'dash@dash': {
              bip44: CsWallet.networks.dash.bip44,
            },
          },
        }));
      }
    });
    return this.pending;
  }
  // TODO make it async
  get(key) {
    // await this.pending;
    if (!this.storage) {
      throw new Error('details not ready');
    }
    if (!key) {
      throw new TypeError('details key must be specified');
    }
    return this.storage[key];
  }
  async set(key, value) {
    this.pending = this.pending
      .then(() => {
        if (this.storage[key] && _.isObject(value)) {
          _.merge(this.storage[key], value);
        } else {
          this.storage[key] = value;
        }
        const json = JSON.stringify(this.storage);
        if (json === this.json) {
          return;
        }
        return this.#save(json);
      });
    return this.pending;
  }

  getCryptoSettings(key) {
    if (!key) {
      throw new TypeError('settings key must be specified');
    }
    const settings = this.get('cryptoSettings') || {};
    return settings[key] || {};
  }

  setCryptotSettings(key, value) {
    if (!key) {
      throw new TypeError('settings key must be specified');
    }
    return this.set('cryptoSettings', {
      [key]: value,
    });
  }

  async #save(json) {
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
  }
}

export default new Details(process.env.SITE_URL);
