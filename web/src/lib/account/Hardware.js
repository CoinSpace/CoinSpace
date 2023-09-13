import {
  platformAuthenticatorIsAvailable,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';

import windowExtra from '../windowExtra.js';

export default class Hardware {
  #request;
  #account;
  #isSupported;

  constructor({ request, account }) {
    if (!request) {
      throw new TypeError('request is required');
    }
    this.#request = request;
    this.#account = account;
  }

  async init() {
    try {
      this.#isSupported = (await platformAuthenticatorIsAvailable());
    } catch (err) { /* empty */ }
  }

  async list() {
    const list = await this.#request({
      url: 'api/v4/crossplatform',
      method: 'get',
      seed: 'device',
    });
    return list;
  }

  async add(seed) {
    try {
      const options = await this.#request({
        url: 'api/v4/crossplatform/registration',
        method: 'get',
        seed,
      });
      let registration;
      if (import.meta.env.VITE_BUILD_TYPE === 'web') {
        if (!this.#isSupported) throw new Error('hardware_not_supported');
        registration = await startRegistration(options);
      } else {
        const params = {
          action: 'registration',
          options: JSON.stringify(options),
          platform: import.meta.env.VITE_PLATFORM,
        };
        registration = await windowExtra.open({
          url: `${import.meta.env.VITE_SITE_URL}fido/?${new URLSearchParams(params)}`,
          name: 'fido',
        });
      }
      await this.#request({
        url: 'api/v4/crossplatform/registration',
        method: 'post',
        data: registration,
        seed,
      });
      return true;
    } catch (err) {
      if (err.message === 'hardware_not_supported') {
        this.#account.emit('CsErrorHardwareNotSupported');
      } else {
        console.error(err);
      }
      return false;
    }
  }

  async remove(seed, credentialID) {
    try {
      await this.#request({
        url: 'api/v4/crossplatform',
        method: 'delete',
        data: {
          credentialID,
        },
        seed,
      });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async walletToken(options) {
    try {
      options = options || await this.#request({
        url: 'api/v4/token/wallet/crossplatform',
        method: 'get',
        seed: 'device',
      });

      let authentication;
      if (import.meta.env.VITE_BUILD_TYPE === 'web') {
        if (!this.#isSupported) throw new Error('hardware_not_supported');
        authentication = await startAuthentication(options);
      } else {
        const params = {
          action: 'authentication',
          options: JSON.stringify(options),
          platform: import.meta.env.VITE_PLATFORM,
        };
        authentication = await windowExtra.open({
          url: `${import.meta.env.VITE_SITE_URL}fido/?${new URLSearchParams(params)}`,
          name: 'fido',
        });
      }
      const res = await this.#request({
        url: 'api/v4/token/wallet/crossplatform',
        method: 'post',
        data: authentication,
        seed: 'device',
      });
      return res.walletToken;
    } catch (err) {
      if (err.message === 'hardware_not_supported') {
        this.#account.emit('CsErrorHardwareNotSupported');
      } else {
        console.error(err);
      }
      return false;
    }
  }
}
