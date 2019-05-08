'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var showQr = require('widgets/modals/qr');
var qrcode = require('lib/qrcode');
var db = require('lib/db');
var showTooltip = require('widgets/modals/tooltip');
var translate = require('lib/i18n').translate;

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
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
      footer: require('../footer.ract')
    }
  });

  var delay = 60 * 1000; // 60 seconds
  var interval;

  ractive.on('before-show', function(context) {
    interval = setInterval(function() {
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
      rate: context.rate
    });

    showQRcode();
  });

  ractive.on('before-hide', function() {
    clearInterval(interval);
  });

  ractive.on('cancel', function() {
    db.set('changellyInfo', null).then(function() {
      emitter.emit('change-changelly-step', 'enterAmount');
    }).catch(function(err) {
      console.error(err);
    })
  });

  ractive.on('help-extra-id', function() {
    showTooltip({
      message: 'Property for addresses of currencies that use additional ID for transaction processing (e.g., destination tag, memo or message).'
    });
  });

  ractive.on('help-network-fee', function() {
    showTooltip({
      message: 'Network fee is fixed and taken each time wherever money is sent. Each currency has a strict amount taken for operations. This fee is taken once your funds are included in a blockchain.'
    });
  });

  ractive.on('show-qr', function(){
    if (ractive.get('isPhonegap')) {
      window.plugins.socialsharing.shareWithOptions({
        message: ractive.get('depositAddress')
      });
    } else {
      showQr({
        address: ractive.get('depositAddress'),
        name: ractive.get('depositSymbol').toLowerCase(),
        title: translate('Deposit address', {symbol: ractive.get('depositSymbol')})
      });
    }
  })

  function showQRcode() {
    if (ractive.get('isPhonegap')) {
      var canvas = ractive.find('#deposit_qr_canvas');
      while (canvas.hasChildNodes()) {
        canvas.removeChild(canvas.firstChild);
      }
      var name = ractive.get('depositSymbol').toLowerCase();
      var qr = qrcode.encode(name + ':' + ractive.get('depositAddress'));
      canvas.appendChild(qr);
    }
  }

  return ractive;
}
