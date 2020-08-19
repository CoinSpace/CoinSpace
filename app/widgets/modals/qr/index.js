'use strict';

const Ractive = require('widgets/modals/base');
const { translate } = require('lib/i18n');
const qrcode = require('lib/qrcode');
const { getTokenNetwork } = require('lib/token');

module.exports = function showTooltip(data) {
  data.mailto = mailto;
  data.title = data.title || translate('Your wallet address');
  const ractive = new Ractive({
    el: document.getElementById('tooltip'),
    partials: {
      content: require('./content.ract'),
    },
    data,
  });

  const canvas = ractive.find('#qr-canvas');
  const name = data.name || getTokenNetwork();
  const qr = qrcode.encode(name + ':' + data.address);
  canvas.appendChild(qr);

  ractive.on('close', ()=> {
    ractive.fire('cancel');
  });

  function mailto() {
    return 'mailto:?body=' + encodeURIComponent(data.address + '\n\nSent from Coin Wallet\nhttps://coin.space');
  }

  return ractive;
};

