'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var showQr = require('widgets/modals/qr');
var qrcode = require('lib/qrcode');
var db = require('lib/db');
var shapeshift = require('lib/shapeshift');
var showError = require('widgets/modals/flash').showError;
var translate = require('lib/i18n').translate;

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
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
      footer: require('../footer.ract')
    }
  });

  var delay = 60 * 1000; // 60 seconds
  var interval;

  ractive.on('before-show', function(context) {

    interval = setInterval(function() {
      emitter.emit('shapeshift');
    }, delay);

    ractive.set({
      depositAddress: context.depositAddress,
      depositSymbol: context.depositSymbol,
      depositCoinName: context.depositCoinName,
      toSymbol: context.toSymbol,
      toAddress: context.toAddress,
      isLoadingMarketInfo: true
    });
    showQRcode();
    shapeshift.marketInfo(context.depositSymbol, context.toSymbol).then(function(data) {
      ractive.set('isLoadingMarketInfo', false);
      ractive.set('depositMax', data.limit);
      ractive.set('depositMin', data.minimum);
      ractive.set('rate', data.rate);
      ractive.set('minerFee', data.minerFee);
    }).catch(function(err) {
      ractive.set('isLoadingMarketInfo', false);
      console.error(err.message);
      return showError({message: err.message});
    });
  });

  ractive.on('before-hide', function() {
    clearInterval(interval);
  });

  ractive.on('cancel', function() {
    db.set('shapeshiftInfo', null).then(function() {
      emitter.emit('change-shapeshift-step', 'create');
    }).catch(function(err) {
      console.error(err);
    })
  });

  ractive.on('show-qr', function(){
    if (ractive.get('isPhonegap')) {
      window.plugins.socialsharing.shareWithOptions({
        message: ractive.get('depositAddress')
      });
    } else {
      showQr({
        address: ractive.get('depositAddress'),
        name: ractive.get('depositCoinName').toLowerCase(),
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
      var name = ractive.get('depositCoinName').toLowerCase();
      var qr = qrcode.encode(name + ':' + ractive.get('depositAddress'));
      canvas.appendChild(qr);
    }
  }

  return ractive;
}
