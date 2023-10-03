import {
  WebAuthnAbortService,
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';

import eventBus from '../eventBus.js';
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
    this.#isSupported = browserSupportsWebAuthn();
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
      if (['web', 'electron'].includes(import.meta.env.VITE_BUILD_TYPE)) {
        if (!this.#isSupported) throw new Error('hardware_not_supported');
        registration = await this.#systemWebAuthn(() => startRegistration(options));
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
        eventBus.emit('CsErrorHardwareNotSupported');
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
      if (['web', 'electron'].includes(import.meta.env.VITE_BUILD_TYPE)) {
        if (!this.#isSupported) throw new Error('hardware_not_supported');
        authentication = await this.#systemWebAuthn(() => startAuthentication(options));
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
        eventBus.emit('CsErrorHardwareNotSupported');
      } else {
        console.error(err);
      }
      return false;
    }
  }

  async #systemWebAuthn(action) {
    try {
      const options = { show: true };
      eventBus.emit('CsModalUseHardwareKey', options);
      const result = await Promise.race([
        action(),
        new Promise((_, reject) => {
          const error = new Error('The operation either timed out or was not allowed.');
          error.name = 'NotAllowedError';
          options.cancel = () => {
            reject(error);
            WebAuthnAbortService.cancelCeremony();
          };
        }),
      ]);
      return result;
    } finally {
      eventBus.emit('CsModalUseHardwareKey', { show: false });
    }
  }
}
