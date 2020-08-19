'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const showQr = require('widgets/modals/qr');
const qrcode = require('lib/qrcode');
const db = require('lib/db');
const showTooltip = require('widgets/modals/tooltip');
const { translate } = require('lib/i18n');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      depositAmount: '',
      depositSymbol: '',
      depositAddress: '-',
      extraId: '',
      networkFee: '',
      toAddress: '',
      toSymbol: '',
      rate: '',
      isPhonegap: process.env.BUILD_TYPE === 'phonegap',
    },
    partials: {
      footer: require('../footer.ract'),
    },
  });

  const delay = 60 * 1000; // 60 seconds
  let interval;

  ractive.on('before-show', (context) => {
    interval = setInterval(() => {
      emitter.emit('changelly');
    }, delay);

    ractive.set({
      depositAmount: context.depositAmount,
      depositSymbol: context.depositSymbol,
      depositAddress: context.depositAddress,
      extraId: context.extraId,
      networkFee: context.networkFee,
      toAddress: context.toAddress,
      toSymbol: context.toSymbol,
      rate: context.rate,
    });

    showQRcode();
  });

  ractive.on('before-hide', () => {
    clearInterval(interval);
  });

  ractive.on('cancel', () => {
    db.set('changellyInfo', null).then(() => {
      emitter.emit('change-changelly-step', 'enterAmount');
    }).catch((err) => {
      console.error(err);
    });
  });

  ractive.on('help-extra-id', () => {
    showTooltip({
      // eslint-disable-next-line max-len
      message: 'Property for addresses of currencies that use additional ID for transaction processing (e.g., destination tag, memo or message).',
    });
  });

  ractive.on('help-network-fee', () => {
    showTooltip({
      // eslint-disable-next-line max-len
      message: 'Network fee is fixed and taken each time wherever money is sent. Each currency has a strict amount taken for operations. This fee is taken once your funds are included in a blockchain.',
    });
  });

  ractive.on('show-qr', ()=> {
    if (ractive.get('isPhonegap')) {
      window.plugins.socialsharing.shareWithOptions({
        message: ractive.get('depositAddress'),
      });
    } else {
      showQr({
        address: ractive.get('depositAddress'),
        name: ractive.get('depositSymbol').toLowerCase(),
        title: translate('Deposit address', { symbol: ractive.get('depositSymbol') }),
      });
    }
  });

  function showQRcode() {
    if (ractive.get('isPhonegap')) {
      const canvas = ractive.find('#deposit_qr_canvas');
      while (canvas.hasChildNodes()) {
        canvas.removeChild(canvas.firstChild);
      }
      const name = ractive.get('depositSymbol').toLowerCase();
      const qr = qrcode.encode(name + ':' + ractive.get('depositAddress'));
      canvas.appendChild(qr);
    }
  }

  return ractive;
};
