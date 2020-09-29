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

const { urlRoot } = window;

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      title: getTitle(),
      touchIdLabel: getTouchIdLabel(),
      isTouchIdEnabled: touchId.isEnabled(),
      isOneFaPrivateEnabled: settings.get('1faPrivate'),
    },
  });

  let isLoadingTouchId = false;
  let isLoadingOneFaPrivate = false;

  ractive.on('back', () => {
    emitter.emit('change-widget-settings-step', 'main');
  });

  ractive.on('toggle-touchid', async () => {
    if (isLoadingTouchId) return;
    isLoadingTouchId = true;

    const isTouchIdEnabled = ractive.get('isTouchIdEnabled');
    if (isTouchIdEnabled) {
      touchId.disable();
      ractive.set('isTouchIdEnabled', false);
    } else {
      try {
        const pin = await getPin();
        await touchId.enable(pin);
        ractive.set('isTouchIdEnabled', true);
      } catch (err) {
        if (err.message !== 'pin_error' && err.message !== 'touch_id_error') console.error(err);
      }
    }
    isLoadingTouchId = false;
  });

  ractive.on('toggle-1fa-private', () => {
    if (isLoadingOneFaPrivate) return;
    isLoadingOneFaPrivate = true;

    // TODO
    ractive.toggle('isOneFaPrivateEnabled');
    isLoadingOneFaPrivate = false;
  });

  return ractive;
};

async function getPin() {
  return new Promise((resolve, reject) => {
    if (process.env.BUILD_TYPE === 'phonegap') {
      const pinWidget = PinWidget({
        async onPin(pin) {
          try {
            // validate PIN
            const pinHash = crypto.createHmac('sha256', Buffer.from(LS.getPinKey(), 'hex')).update(pin).digest('hex');
            await request({
              url: `${urlRoot}v2/token/public/pin?id=${LS.getId()}`,
              method: 'post',
              data: {
                pinHash,
              },
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
        reject(new Error('pin_error'));
      });
    } else {
      resolve();
    }
  });
}

function getTitle() {
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
    return translate('Touch ID');
  } else if (os === 'android') {
    return translate('Fingerprint');
  } else {
    return translate('Biometrics');
  }
}
