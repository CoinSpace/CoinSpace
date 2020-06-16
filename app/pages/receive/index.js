'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var CS = require('lib/wallet');
var showTooltip = require('widgets/modals/tooltip');
var showQr = require('widgets/modals/qr');
var geo = require('lib/geo');
var showError = require('widgets/modals/flash').showError;
var showSetDetails = require('widgets/modals/set-details');
var getTokenNetwork = require('lib/token').getTokenNetwork;
var qrcode = require('lib/qrcode');
var initEosSetup = require('widgets/eos/setup');
var db = require('lib/db');
var translate = require('lib/i18n').translate;

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
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
      getAddressTypeLabel: function(type) {
        if (type === 'p2pkh') return '(P2PKH)';
        if (type === 'p2sh') return '(P2SH)';
        if (type === 'p2wpkh') return '(Bech32)';
        return '-';
      },
      getAddressTypeOption: function(type) {
        if (type === 'p2pkh') return translate('P2PKH - Legacy');
        if (type === 'p2sh') return translate('P2SH - SegWit compatible');
        if (type === 'p2wpkh') return translate('Bech32 - SegWit native');
        return '-';
      },
    },
  });

  initEosSetup(ractive.find('#eos-setup'));

  emitter.on('wallet-ready', function() {
    var wallet = CS.getWallet();
    ractive.set('needToSetupEos', wallet.networkName === 'eos' && !wallet.isActive);

    var addressTypes = (wallet.network && wallet.network.addressTypes) || [];
    ractive.set('addressTypes', addressTypes);
    ractive.set('addressType', wallet.addressType);
    ractive.set('addressTooltip', ['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash'].indexOf(wallet.networkName) !== -1);
    showAddress();
  });
  emitter.on('tx-sent', showAddress);
  emitter.on('change-address-type', showAddress);

  ractive.on('change-address-type', function() {
    var wallet = CS.getWallet();
    var addressType = ractive.get('addressType');
    db.set(wallet.networkName + '.addressType', addressType).then(function() {
      wallet.addressType = addressType;
      emitter.emit('change-address-type');
    }).catch(console.error);
  });

  ractive.on('toggle-broadcast', function() {
    if (ractive.get('connecting')) return;

    if (ractive.get('broadcasting')) {
      mectoOff();
    } else {
      showSetDetails(function(err) {
        if (err) {
          return showError({message: 'Could not save your details'});
        }
        mectoOn();
      });
    }
  });

  function showQRcode(address) {
    if (ractive.get('isPhonegap')) {
      var canvas = document.getElementById('qr_canvas');
      while (canvas.hasChildNodes()) {
        canvas.removeChild(canvas.firstChild);
      }
      var qr = qrcode.encode(getTokenNetwork() + ':' + address);
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
    geo.save(function(err) {
      if (err) {
        return handleMectoError(err);
      }
      ractive.set('connecting', false);
      ractive.set('broadcasting', true);
      ractive.set('btn_message', 'Turn Mecto off');
    });
  }

  ractive.on('show-qr', function() {
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

  ractive.on('help-address', function() {
    var message = translate('Address will be changed after receiving funds. All previously used addresses remain valid and still can be used to receive funds multiple times. Please use fresh address for each receiving transaction to enhance your privacy.');
    if (ractive.get('addressTypes').length > 1) {
      message += '<br><br>';
      message += translate(
        'Not all address types are fully compatible on all platforms, so it is important to use a compatible address (:url).',
        {url: "<a href=\"\" onclick=\"window.open('https://www.coin.space/all-about-address-types/', '_blank'); return false;\">" + translate('more info') + "</a>"}
      );
    }
    showTooltip({
      message: message,
      isHTML: true,
      isTranslated: true,
    });
  });

  ractive.on('help-mecto', function() {
    showTooltip({
      message: 'Mecto lets you broadcast your wallet address to other nearby Coin users by comparing GPS data. This data is deleted once you turn Mecto off.',
    });
  });

  function showAddress() {
    var address = CS.getWallet().getNextAddress();
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
