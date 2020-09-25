'use strict';

// https://github.com/defunctzombie/qr.js/blob/515790fad4682b2d38008f229dbd814b0d2633e4/example/index.js
const qr = require('qr.js');
const emitter = require('lib/emitter');
const EthereumWallet = require('cs-ethereum-wallet');
const { isValidIban } = EthereumWallet.prototype;
const { getAddressFromIban } = EthereumWallet.prototype;
const isScanAvailable = process.env.BUILD_TYPE === 'phonegap';

function encode(string, options) {
  options = options || {};
  const width = options.width || 200;
  const height = options.height || 200;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');

  const cells = qr(string).modules;

  const tileW = width  / cells.length;
  const tileH = height / cells.length;

  for (let r = 0; r < cells.length ; ++r) {
    const row = cells[r];
    for (let c = 0; c < row.length ; ++c) {
      ctx.fillStyle = row[c] ? '#000' : '#fff';
      const w = (Math.ceil((c+1)*tileW) - Math.floor(c*tileW));
      const h = (Math.ceil((r+1)*tileH) - Math.floor(r*tileH));
      ctx.fillRect(Math.round(c*tileW), Math.round(r*tileH), w, h);
    }
  }

  return canvas;
}

function scan(data) {
  if (!isScanAvailable) return false;

  // eslint-disable-next-line no-undef
  cordova.plugins.barcodeScanner.scan(
    (result) => {
      if (result.text) {
        let address = result.text.split('?')[0].split(':').pop();

        if (isValidIban(address)) {
          address = getAddressFromIban(address);
        }

        emitter.emit('prefill-wallet', address, data.context);

        let match;
        match = result.text.match(/amount=([0-9.]+)/);
        if (match && match[1]) {
          emitter.emit('prefill-value', match[1], data.context);
        }
        match = result.text.match(/dt=(\d+)/);
        if (match && match[1]) {
          emitter.emit('prefill-destination-tag', match[1], data.context);
        }
      }
    },
    () => {
      const alert = navigator.notification ? navigator.notification.alert : window.alert;
      alert(
        'Access to the camera has been prohibited; please enable it in the Settings app to continue',
        () => {},
        'Coin'
      );
    },
    {
      showTorchButton: true,
    }
  );
}

module.exports = {
  encode,
  scan,
  isScanAvailable,
};

