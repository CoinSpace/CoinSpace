'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const showQr = require('widgets/modals/qr');
const qrcode = require('lib/qrcode');
const db = require('lib/db');
const shapeshift = require('lib/shapeshift');
const { showError } = require('widgets/modals/flash');
const { translate } = require('lib/i18n');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      depositAddress: '-',
      depositSymbol: '',
      depositCoinName: '',
      depositMax: '',
      depositMin: '',
      toSymbol: '',
      toAddress: '',
      rate: '',
      minerFee: '',
      isLoadingMarketInfo: true,
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
      emitter.emit('shapeshift');
    }, delay);

    ractive.set({
      depositAddress: context.depositAddress,
      depositSymbol: context.depositSymbol,
      depositCoinName: context.depositCoinName,
      toSymbol: context.toSymbol,
      toAddress: context.toAddress,
      isLoadingMarketInfo: true,
    });
    showQRcode();
    shapeshift.marketInfo(context.depositSymbol, context.toSymbol).then((data) => {
      ractive.set('isLoadingMarketInfo', false);
      ractive.set('depositMax', data.limit);
      ractive.set('depositMin', data.minimum);
      ractive.set('rate', data.rate);
      ractive.set('minerFee', data.minerFee);
    }).catch((err) => {
      ractive.set('isLoadingMarketInfo', false);
      console.error(err.message);
      return showError({ message: err.message });
    });
  });

  ractive.on('before-hide', () => {
    clearInterval(interval);
  });

  ractive.on('cancel', () => {
    db.set('shapeshiftInfo', null).then(() => {
      emitter.emit('change-shapeshift-step', 'create');
    }).catch((err) => {
      console.error(err);
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
        name: ractive.get('depositCoinName').toLowerCase(),
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
      const name = ractive.get('depositCoinName').toLowerCase();
      const qr = qrcode.encode(name + ':' + ractive.get('depositAddress'));
      canvas.appendChild(qr);
    }
  }

  return ractive;
};
