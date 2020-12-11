'use strict';

const request = require('lib/request');
const PinWidget = require('widgets/pin');
const settings = require('lib/wallet/settings');
const seeds = require('./seeds');
const LS = require('./localStorage');
const crypto = require('crypto');
const emitter = require('lib/emitter');
const touchId = require('lib/touch-id');
const hardware = require('lib/hardware');
const { urlRoot } = window;

function unlock(wallet) {
  return new Promise((resolve, reject) => {
    if (settings.get('1faPrivate')) {
      const pinWidget = PinWidget({
        touchId: true,
        append: true,
        async onPin(pin) {
          try {
            const privateToken = await _getPrivateTokenByPin(pin, pinWidget);
            seeds.unlock('private', privateToken);
            if (wallet) wallet.unlock(seeds.get('private'));
            pinWidget.close();
            resolve();
          } catch (err) {
            if (err.message === 'hardware_error') return;
            pinWidget.wrong();
            emitter.emit('auth-error', err);
          }
        },
        async onTouchId() {
          try {
            let privateToken;
            if (process.env.BUILD_TYPE === 'phonegap') {
              await touchId.phonegap();
              const pin = LS.getPin();
              pinWidget.set('isLoading', true);
              privateToken = await _getPrivateTokenByPin(pin, pinWidget);
            } else {
              privateToken = await touchId.privateToken();
              pinWidget.set('isLoading', true);
            }
            seeds.unlock('private', privateToken);
            if (wallet) wallet.unlock(seeds.get('private'));
            pinWidget.close();
            resolve();
          } catch (err) {
            if (err.message === 'touch_id_error') return;
            if (err.message === 'hardware_error') return;
            pinWidget.wrong();
            emitter.emit('auth-error', err);
          }
        },
      });

      pinWidget.on('back', () => {
        reject(new Error('cancelled'));
      });

    } else {
      return _getPrivateToken().then((privateToken) => {
        seeds.unlock('private', privateToken);
        if (wallet) wallet.unlock(seeds.get('private'));
        resolve();
      }).catch((err) => {
        if (err.message === 'hardware_error') return reject(new Error('cancelled'));
        reject(err);
      });
    }
  });
}

function lock(wallet) {
  if (wallet) wallet.lock();
  seeds.lock('private');
}

async function _getPrivateTokenByPin(pin, pinWidget) {
  const pinHash = crypto.createHmac('sha256', Buffer.from(LS.getPinKey(), 'hex')).update(pin).digest('hex');
  const res = await request({
    url: `${urlRoot}api/v2/token/private/pin`,
    method: 'post',
    data: {
      pinHash,
    },
    seed: 'public',
  });

  if (res.privateToken) {
    return res.privateToken;
  } else if (res.challenge) {
    pinWidget.reset();
    return hardware.privateToken(res);
  }
}

async function _getPrivateToken() {
  if (settings.get('hasAuthenticators')) {
    return hardware.privateToken();
  } else {
    return request({
      url: `${urlRoot}api/v2/token/private`,
      method: 'get',
      seed: 'public',
    }).then(({ privateToken }) => privateToken);
  }
}

module.exports = {
  unlock,
  lock,
};
