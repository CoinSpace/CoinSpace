'use strict';

const request = require('lib/request');
const PinWidget = require('widgets/pin');
const settings = require('lib/wallet/settings');
const seeds = require('./seeds');
const LS = require('./localStorage');
const crypto = require('crypto');

function unlock(wallet) {
  return new Promise((resolve) => {
    if (settings.get('1faPrivate')) {
      const pinWidget = PinWidget({
        touchId: true,
        append: true,
        onPin(pin) {
          const pinHash = crypto.createHmac('sha256', Buffer.from(LS.getPinKey(), 'hex')).update(pin).digest('hex');
          return request({
            url: `/api/v2/token/private/pin?id=${LS.getId()}`,
            method: 'post',
            data: {
              pinHash,
            },
            seed: 'public',
          }).then(({ privateToken }) => {
            seeds.unlock('private', privateToken);
            if (wallet) wallet.unlock(seeds.get('private'));
            pinWidget.close();
            resolve();
          }).catch(() => {
            pinWidget.wrong();
          });
        }
      });
    } else {
      return request({
        url: `/api/v2/token/private?id=${LS.getId()}`,
        method: 'get',
        seed: 'public',
      }).then(({ privateToken }) => {
        seeds.unlock('private', privateToken);
        if (wallet) wallet.unlock(seeds.get('private'));
        resolve();
      });
    }
  });
}

function lock(wallet) {
  if (wallet) wallet.lock();
  seeds.lock('private');
}

module.exports = {
  unlock,
  lock,
};
