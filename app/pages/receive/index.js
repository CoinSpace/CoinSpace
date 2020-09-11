'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const CS = require('lib/wallet');
const showTooltip = require('widgets/modals/tooltip');
const showQr = require('widgets/modals/qr');
const geo = require('lib/geo');
const { showError } = require('widgets/modals/flash');
const showSetDetails = require('widgets/modals/set-details');
const { getTokenNetwork } = require('lib/token');
const qrcode = require('lib/qrcode');
const initEosSetup = require('widgets/eos/setup');
const details = require('lib/wallet/details');
const { translate } = require('lib/i18n');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      address: '',
      qrVisible: false,
      btn_message: 'Turn Mecto on',
      connecting: false,
      broadcasting: false,
      isPhonegap: process.env.BUILD_TYPE === 'phonegap',
      addressTypes: [],
      addressType: '',
      addressTooltip: false,
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
      showSetDetails((err) => {
        if (err) {
          return showError({ message: 'Could not save your details' });
        }
        mectoOn();
      });
    }
  });

  function showQRcode(address) {
    if (ractive.get('isPhonegap')) {
      const canvas = document.getElementById('qr_canvas');
      while (canvas.hasChildNodes()) {
        canvas.removeChild(canvas.firstChild);
      }
      const qr = qrcode.encode(getTokenNetwork() + ':' + address);
      canvas.appendChild(qr);
    }
  }

  function mectoOff() {
    ractive.set('broadcasting', false);
    ractive.set('btn_message', 'Turn Mecto on');
    geo.remove();
  }

  function mectoOn() {
    ractive.set('connecting', true);
    ractive.set('btn_message', 'Checking your location');
    geo.save((err) => {
      if (err) {
        return handleMectoError(err);
      }
      ractive.set('connecting', false);
      ractive.set('broadcasting', true);
      ractive.set('btn_message', 'Turn Mecto off');
    });
  }

  ractive.on('show-qr', () => {
    if (ractive.get('isPhonegap')) {
      window.plugins.socialsharing.shareWithOptions({
        message: ractive.get('address'),
      });
    } else {
      showQr({
        address: ractive.get('address'),
      });
    }
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
        { url: "<a href=\"\" onclick=\"window.open('https://www.coin.space/all-about-address-types/', '_blank'); return false;\">" + translate('more info') + "</a>" }
      );
    }
    showTooltip({
      message,
      isHTML: true,
      isTranslated: true,
    });
  });

  ractive.on('help-mecto', () => {
    showTooltip({
      // eslint-disable-next-line max-len
      message: 'Mecto lets you broadcast your wallet address to other nearby Coin users by comparing GPS data. This data is deleted once you turn Mecto off.',
    });
  });

  function showAddress() {
    const address = CS.getWallet().getNextAddress();
    ractive.set('address', address);
    showQRcode(address);
  }

  function handleMectoError(err) {
    showError({
      message: err.message,
    });
    ractive.set('connecting', false);
    ractive.set('broadcasting', false);
    ractive.set('btn_message', 'Turn Mecto on');
  }

  return ractive;
};
