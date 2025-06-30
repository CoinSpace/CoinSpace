import i18n from '../i18n/i18n.js';
import os from '../detectOs.js';
import {
  platformAuthenticatorIsAvailable,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';

export const TYPES = {
  BIOMETRICS: Symbol('BIOMETRICS'),
  FINGERPRINT: Symbol('FINGERPRINT'),
  TOUCH_ID: Symbol('TOUCH_ID'),
  FACE_ID: Symbol('FACE_ID'),
};

export default class Biometry {
  #request;
  #clientStorage;
  #isAvailable;
  #type;

  get isAvailable() {
    return this.#isAvailable;
  }

  get isEnabled() {
    if (!this.#isAvailable) return false;
    return this.#clientStorage.isBiometryEnabled();
  }

  get type() {
    return this.#type;
  }

  constructor({ request, clientStorage }) {
    if (!request) {
      throw new TypeError('request is required');
    }
    if (!clientStorage) {
      throw new TypeError('clientStorage is required');
    }
    this.#clientStorage = clientStorage;
    this.#request = request;
  }

  async init() {
    let isAvailable = false;
    let type;

    try {
      if (import.meta.env.VITE_BUILD_TYPE === 'phonegap') {
        type = await new Promise((resolve) => {
          window.Fingerprint.isAvailable(
            (result) => resolve(result),
            () => resolve(false),
            { requireStrongBiometrics: true }
          );
        });
        isAvailable = !!type;
      } else if (import.meta.env.VITE_BUILD_TYPE === 'electron') {
        isAvailable = false;
      } else {
        isAvailable = await platformAuthenticatorIsAvailable();
      }
    } catch (err) {
      isAvailable = false;
    }

    if (isAvailable) {
      if (import.meta.env.VITE_BUILD_TYPE === 'phonegap') {
        if (type === 'face') {
          type = TYPES.FACE_ID;
        } else if (type === 'finger') {
          type = import.meta.env.VITE_PLATFORM === 'ios' ? TYPES.TOUCH_ID : TYPES.FINGERPRINT;
        } else if (type === 'biometric') {
          type = TYPES.BIOMETRICS;
        }
      } else {
        if (os === 'macos') {
          type = TYPES.TOUCH_ID;
        } else {
          type = TYPES.BIOMETRICS;
        }
      }
    }

    this.#isAvailable = isAvailable;
    this.#type = type;
  }

  async enable(pin, seed) {
    try {
      if (import.meta.env.VITE_BUILD_TYPE === 'phonegap') {
        await new Promise((resolve, reject) => {
          window.Fingerprint.registerBiometricSecret({
            description: import.meta.env.VITE_PLATFORM === 'ios' ? i18n.global.t('Scan your fingerprint please') : '',
            secret: pin,
            invalidateOnEnrollment: true,
            fallbackButtonTitle: i18n.global.t('Cancel'),
            disableBackup: true,
          }, resolve, reject);
        });
      } else {
        const options = await this.#request({
          url: 'api/v4/platform/registration',
          method: 'get',
          seed,
        });
        const registration = await startRegistration(options);
        await this.#request({
          url: 'api/v4/platform/registration',
          method: 'post',
          data: registration,
          seed,
        });
      }
      this.#clientStorage.setBiometryEnabled(true);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async disable(seed) {
    try {
      if (import.meta.env.VITE_BUILD_TYPE !== 'phonegap') {
        await this.#request({
          url: 'api/v4/platform',
          method: 'delete',
          seed,
        });
      }
      this.#clientStorage.setBiometryEnabled(false);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async phonegap() {
    try {
      const pin = await new Promise((resolve, reject) => {
        window.Fingerprint.loadBiometricSecret({
          description: import.meta.env.VITE_PLATFORM === 'ios' ? i18n.global.t('Scan your fingerprint please') : '',
          fallbackButtonTitle: i18n.global.t('Cancel'),
          disableBackup: true,
        }, (secret) => resolve(secret), () => reject());
      });
      return pin;
    } catch (err) { /* empty */ }
  }

  async deviceToken() {
    try {
      const options = await this.#request({
        url: 'api/v4/token/device/platform',
        method: 'get',
        id: true,
      });
      const authentication = await startAuthentication(options);
      const res = await this.#request({
        url: 'api/v4/token/device/platform',
        method: 'post',
        data: authentication,
        id: true,
      });
      return res.deviceToken;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async walletToken() {
    try {
      const options = await this.#request({
        url: 'api/v4/token/wallet/platform',
        method: 'get',
        seed: 'device',
      });
      const authentication = await startAuthentication(options);
      const res = await this.#request({
        url: 'api/v4/token/wallet/platform',
        method: 'post',
        data: authentication,
        seed: 'device',
      });
      return res;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}
