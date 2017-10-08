'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var showQr = require('widgets/modal-qr');
var qrcode = require('lib/qrcode');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      depositAddress: '-',
      depositSymbol: '',
      depositMax: '',
      depositMin: '',
      toSymbol: '',
      toAddress: '',

      isSocialSharing: process.env.BUILD_TYPE === 'phonegap' && window.plugins && window.plugins.socialsharing,
      // isSocialSharing: true
    }
  });

  ractive.on('back', function() {
    console.log('back');
    emitter.emit('change-exchange-step', 'create');
  });

  emitter.on('set-exchange-awaiting-deposit', function(data) {
    ractive.set({
      depositAddress: data.depositAddress,
      depositSymbol: data.depositSymbol,
      depositMax: data.depositMax,
      depositMin: data.depositMin,
      toSymbol: data.toSymbol,
      toAddress: data.toAddress
    });
    if (data.depositAddress) {
      showQRcode();
    }
  });

  ractive.on('show-qr', function(){
    if (ractive.get('isSocialSharing')) {
      window.plugins.socialsharing.shareWithOptions({
        message: ractive.get('depositAddress')
      }, function() {
        if (window.FacebookAds && window.FacebookAds.fixBanner) {
          window.FacebookAds.fixBanner();
        }
      });
    } else {
      showQr({
        address: ractive.get('depositAddress')
      });
    }
  })

  function showQRcode() {
    console.log('showQRcode');
    if (ractive.get('isSocialSharing')) {
      var canvas = ractive.find('#deposit_qr_canvas');
      while (canvas.hasChildNodes()) {
        canvas.removeChild(canvas.firstChild);
      }
      var qr = qrcode('litcoin:' + ractive.get('depositAddress')); // TODO: update currency
      canvas.appendChild(qr);
    }
  }

  return ractive;
}
