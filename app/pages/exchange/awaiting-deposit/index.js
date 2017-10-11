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
      isLoading: true,
      depositAddress: '-',
      depositSymbol: '',
      depositMax: '',
      depositMin: '',
      toSymbol: '',
      toAddress: '',

      isSocialSharing: process.env.BUILD_TYPE === 'phonegap' && window.plugins && window.plugins.socialsharing,
      // isSocialSharing: true
    },
    partials: {
      loader: require('../loader.ract'),
      footer: require('../footer.ract')
    }
  });

  ractive.on('before-show', function(context) {
    setTimeout(function() {
      ractive.set('isLoading', false);
      ractive.set({
        depositAddress: context.depositAddress,
        depositSymbol: context.depositSymbol,
        depositMax: context.depositMax,
        depositMin: context.depositMin,
        toSymbol: context.toSymbol,
        toAddress: context.toAddress
      });
      if (context.depositAddress) {
        showQRcode();
      }
    }, 500);
  });

  ractive.on('before-hide', function() {
    ractive.set('isLoading', true);
  });

  ractive.on('back', function() {
    console.log('back');
    emitter.emit('change-exchange-step', 'create');
  });

  // emitter.on('set-exchange-awaiting-deposit', function(data) {

  // });

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
      var qr = qrcode.encode('litcoin:' + ractive.get('depositAddress')); // TODO: update currency
      canvas.appendChild(qr);
    }
  }

  return ractive;
}
