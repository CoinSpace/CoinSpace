'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const { translate } = require('lib/i18n');
const os = require('lib/detect-os');
const settings = require('lib/wallet/settings');
const touchId = require('lib/touch-id');
const PinWidget = require('widgets/pin');
const request = require('lib/request');
const LS = require('lib/wallet/localStorage');
const crypto = require('crypto');
const security = require('lib/wallet/security');

const { urlRoot } = window;

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      title: getTitle(),
      touchIdLabel: getTouchIdLabel(),
      isTouchIdAvailable: touchId.isAvailable(),
      isTouchIdEnabled: touchId.isEnabled(),
      isOneFaPrivateEnabled: settings.get('1faPrivate'),
    },
  });

  let isLoadingTouchId = false;
  let isLoadingOneFaPrivate = false;

  ractive.on('back', () => {
    ractive.fire('change-step', { step: 'main' });
  });

  ractive.on('toggle-touchid', async () => {
    if (isLoadingTouchId) return;
    isLoadingTouchId = true;
    const { unlock, lock } = security;

    const isTouchIdEnabled = ractive.get('isTouchIdEnabled');
    try {
      if (process.env.BUILD_TYPE === 'phonegap') {
        if (isTouchIdEnabled) {
          await touchId.disable();
        } else {
          const pin = await getPin();
          await touchId.enable(pin);
        }
      } else {
        await unlock();
        if (isTouchIdEnabled) {
          await touchId.disable();
        } else {
          await touchId.enable();
        }
        lock();
      }
      ractive.set('isTouchIdEnabled', !isTouchIdEnabled);
    } catch (err) {
      lock();
      if (err.message !== 'touch_id_error' && err.message !== 'cancelled') console.error(err);
    }
    isLoadingTouchId = false;
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
};

async function getPin() {
  return new Promise((resolve, reject) => {
    const pinWidget = PinWidget({
      async onPin(pin) {
        try {
          const pinHash = crypto.createHmac('sha256', Buffer.from(LS.getPinKey(), 'hex')).update(pin).digest('hex');
          await request({
            url: `${urlRoot}api/v2/token/public/pin`,
            method: 'post',
            data: {
              pinHash,
            },
            id: true,
          });
          pinWidget.close();
          resolve(pin);
        } catch (err) {
          pinWidget.wrong();
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
  if (!touchId.isAvailable()) return translate('PIN');
  if (os === 'ios' || os === 'macos') {
    return translate('PIN & Touch ID');
  } else if (os === 'android') {
    return translate('PIN & Fingerprint');
  } else {
    return translate('PIN & Biometrics');
  }
}

function getTouchIdLabel() {
  if (os === 'ios' || os === 'macos') {
    return 'Touch&nbsp;ID';
  } else if (os === 'android') {
    return translate('Fingerprint');
  } else {
    return translate('Biometrics');
  }
}
