import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import { translate } from 'lib/i18n';
import os from 'lib/detect-os';
import settings from 'lib/wallet/settings';
import biometry from 'lib/biometry';
import PinWidget from 'widgets/pin';
import request from 'lib/request';
import LS from 'lib/wallet/localStorage';
import crypto from 'crypto';
import security from 'lib/wallet/security';
import template from './index.ract';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
    data: {
      title: getTitle(),
      biometryLabel: getBiometryLabel(),
      isBiometryAvailable: biometry.isAvailable(),
      isBiometryEnabled: biometry.isEnabled(),
      isOneFaPrivateEnabled: settings.get('1faPrivate'),
    },
  });

  let isLoadingBiometry = false;
  let isLoadingOneFaPrivate = false;

  ractive.on('back', () => {
    ractive.fire('change-step', { step: 'main' });
  });

  ractive.on('toggle-biometry', async () => {
    if (isLoadingBiometry) return;
    isLoadingBiometry = true;
    const { unlock, lock } = security;

    const isBiometryEnabled = ractive.get('isBiometryEnabled');
    try {
      if (process.env.BUILD_TYPE === 'phonegap') {
        if (isBiometryEnabled) {
          await biometry.disable();
        } else {
          const pin = await getPin();
          await biometry.enable(pin);
        }
      } else {
        await unlock();
        if (isBiometryEnabled) {
          await biometry.disable();
        } else {
          await biometry.enable();
        }
        lock();
      }
      ractive.set('isBiometryEnabled', !isBiometryEnabled);
    } catch (err) {
      lock();
      if (err.message !== 'biometry_error' && err.message !== 'cancelled') console.error(err);
    }
    isLoadingBiometry = false;
  });

  ractive.on('toggle-1fa-private', async () => {
    if (isLoadingOneFaPrivate) return;
    isLoadingOneFaPrivate = true;

    try {
      const isOneFaPrivateEnabled = ractive.get('isOneFaPrivateEnabled');
      await settings.set('1faPrivate', !isOneFaPrivateEnabled, security);
      ractive.set('isOneFaPrivateEnabled', !isOneFaPrivateEnabled);
    } catch (err) {
      if (err.message !== 'cancelled') console.error(err);
    }

    isLoadingOneFaPrivate = false;
  });

  return ractive;
}

async function getPin() {
  return new Promise((resolve, reject) => {
    const pinWidget = PinWidget({
      async onPin(pin) {
        try {
          const pinHash = crypto.createHmac('sha256', Buffer.from(LS.getPinKey(), 'hex')).update(pin).digest('hex');
          await request({
            url: `${process.env.SITE_URL}api/v3/token/public/pin`,
            method: 'post',
            data: {
              pinHash,
            },
            id: true,
          });
          this.close();
          resolve(pin);
        } catch (err) {
          this.wrong();
          emitter.emit('auth-error', err);
        }
      },
    });
    pinWidget.on('back', () => {
      reject(new Error('cancelled'));
    });
  });
}

function getTitle() {
  if (!biometry.isAvailable()) return translate('PIN');
  if (os === 'ios' || os === 'macos') {
    return translate('PIN & Touch ID');
  } else if (os === 'android') {
    return translate('PIN & Fingerprint');
  } else {
    return translate('PIN & Biometrics');
  }
}

function getBiometryLabel() {
  if (os === 'ios' || os === 'macos') {
    return 'Touch&nbsp;ID';
  } else if (os === 'android') {
    return translate('Fingerprint');
  } else {
    return translate('Biometrics');
  }
}
