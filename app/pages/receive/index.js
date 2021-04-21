'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const CS = require('lib/wallet');
const showTooltip = require('widgets/modals/tooltip');
const geo = require('lib/geo');
const { showError } = require('widgets/modals/flash');
const showSetDetails = require('widgets/modals/set-details');
const qrcode = require('lib/qrcode');
const initEosSetup = require('widgets/eos/setup');
const details = require('lib/wallet/details');
const clipboard = require('lib/clipboard');
const { translate } = require('lib/i18n');
const { getWallet } = require('lib/wallet');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      address: '',
      qrVisible: false,
      connecting: false,
      broadcasting: false,
      isPhonegap: process.env.BUILD_TYPE === 'phonegap',
      addressTypes: [],
      addressType: '',
      addressTooltip: false,
      isMonero: false,
      isAccepting: false,
      txId: '',
      getAddressTypeLabel(type) {
        if (type === 'p2pkh') return '(P2PKH)';
        if (type === 'p2sh') return '(P2SH)';
        if (type === 'p2wpkh') return '(Bech32)';
        return '-';
      },
      getAddressTypeOption(type) {
        if (type === 'p2pkh') return translate('P2PKH - Legacy');
        if (type === 'p2sh') return translate('P2SH - SegWit compatible');
        if (type === 'p2wpkh') return translate('Bech32 - SegWit native');
        return '-';
      },
    },
  });

  initEosSetup(ractive.find('#eos-setup'));

  clipboard(ractive, '.js-address-input', 'isCopiedAddress');

  emitter.on('wallet-ready', () => {
    const wallet = CS.getWallet();
    ractive.set('needToSetupEos', wallet.networkName === 'eos' && !wallet.isActive);

    const addressTypes = (wallet.network && wallet.network.addressTypes) || [];
    ractive.set('addressTypes', addressTypes);
    ractive.set('addressType', wallet.addressType);
    ractive.set('addressTooltip', [
      'bitcoin',
      'bitcoincash',
      'bitcoinsv',
      'litecoin',
      'dogecoin',
      'dash',
    ].indexOf(wallet.networkName) !== -1);
    showAddress();
  });
  emitter.on('tx-sent', showAddress);
  emitter.on('change-address-type', showAddress);

  ractive.on('before-show', () => {
    const network = getWallet().networkName;
    ractive.set('isMonero', network === 'monero');
  });

  ractive.on('change-address-type', () => {
    const wallet = CS.getWallet();
    const addressType = ractive.get('addressType');
    details.set(wallet.networkName + '.addressType', addressType)
      .then(() => {
        wallet.addressType = addressType;
        emitter.emit('change-address-type');
      })
      .catch(console.error);
  });

  ractive.on('toggle-broadcast', () => {
    if (ractive.get('connecting')) return;

    if (ractive.get('broadcasting')) {
      mectoOff();
    } else {
      showSetDetails(() => {
        mectoOn();
      });
    }
  });

  function mectoOff() {
    ractive.set('broadcasting', false);
    geo.remove();
  }

  async function mectoOn() {
    ractive.set('connecting', true);
    try {
      await geo.save();
      ractive.set('connecting', false);
      ractive.set('broadcasting', true);
    } catch (err) {
      return handleMectoError(err);
    }
  }

  ractive.on('share', () => {
    window.plugins.socialsharing.shareWithOptions({
      message: ractive.get('address'),
    });
  });

  ractive.on('email', () => {
    const address = ractive.get('address');
    const link = 'mailto:?body=' + encodeURIComponent(`${address}\n\nSent from Coin Wallet\nhttps://coin.space`);
    window.safeOpen(link, '_blank');
  });

  ractive.on('help-address', () => {
    // eslint-disable-next-line max-len
    let message = translate('Address will be changed after receiving funds. All previously used addresses remain valid and still can be used to receive funds multiple times. Please use fresh address for each receiving transaction to enhance your privacy.');
    if (ractive.get('addressTypes').length > 1) {
      message += '<br><br>';
      message += translate(
        // eslint-disable-next-line max-len
        'Not all address types are fully compatible on all platforms, so it is important to use a compatible address (:url).',
        // eslint-disable-next-line max-len
        { url: "<a href=\"\" onclick=\"return window.safeOpen('https://coin.space/all-about-address-types/', '_blank');\">" + translate('more info') + '</a>' }
      );
    }
    showTooltip({
      message,
      isHTML: true,
      isTranslated: true,
    });
  });

  ractive.on('clearTxId', () => {
    ractive.set('txId', '');
    ractive.find('#tx-id').focus();
  });

  ractive.on('accept', () => {
    ractive.set('isAccepting', true);
    setTimeout(() => {
      ractive.set('isAccepting', false);
    }, 1000);
  });

  function showAddress() {
    const address = CS.getWallet().getNextAddress();
    ractive.set('address', address);
    const $canvas = ractive.find('#qr_canvas');
    const qr = qrcode.encode(CS.getWallet().networkName + ':' + address);
    $canvas.innerHTML = qr;
  }

  function handleMectoError(err) {
    showError({
      message: err.message,
    });
    ractive.set('connecting', false);
    ractive.set('broadcasting', false);
  }

  return ractive;
};
