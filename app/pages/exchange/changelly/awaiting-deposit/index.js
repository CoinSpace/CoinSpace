'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const qrcode = require('lib/qrcode');
const details = require('lib/wallet/details');
const showTooltip = require('widgets/modals/tooltip');
const { translate } = require('lib/i18n');
const clipboard = require('lib/clipboard');

const extraIdLabels = {
  XLM: 'Memo',
  EOS: 'Memo',
  XRP: 'Destination tag',
};

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      depositAmount: '',
      depositSymbol: '',
      depositAddress: '-',
      extraId: '',
      extraIdLabel: 'Extra Id',
      networkFee: '',
      toAddress: '',
      toSymbol: '',
      rate: '',
      changellyTransactionId: '',
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
      extraIdLabel: translate(extraIdLabels[context.depositSymbol] || 'Extra Id'),
      networkFee: context.networkFee,
      toAddress: context.toAddress,
      toSymbol: context.toSymbol,
      rate: context.rate,
      changellyTransactionId: context.id,
    });

    const canvas = ractive.find('#deposit_qr_canvas');
    const name = ractive.get('depositSymbol').toLowerCase();
    const qr = qrcode.encode(`${name}:${context.depositAddress}`);
    canvas.innerHTML = qr;
  });

  clipboard(ractive, '.js-deposit-address', 'isCopiedDepositAddress');
  clipboard(ractive, '.js-extra-id', 'isCopiedExtraId');

  ractive.on('before-hide', () => {
    clearInterval(interval);
  });

  ractive.on('cancel', () => {
    details.set('changellyInfo', null).then(() => {
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

  ractive.on('share', () => {
    window.plugins.socialsharing.shareWithOptions({
      message: getShareMessage(),
    });
  });

  ractive.on('email', () => {
    const message = getShareMessage();
    const link = 'mailto:?body=' + encodeURIComponent(`${message}\n\nSent from Coin Wallet\nhttps://coin.space`);
    window.safeOpen(link, '_blank');
  });

  function getShareMessage() {
    let message = ractive.get('depositAddress');
    const extraId = ractive.get('extraId');
    const extraIdLabel = ractive.get('extraIdLabel');
    if (extraId) {
      message = `${message} (${extraIdLabel}: ${extraId})`;
    }
    return message;
  }

  return ractive;
};
