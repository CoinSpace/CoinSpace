'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var initShapeshift = require('./shapeshift');
var initChangelly = require('./changelly');
var initMoonpay = require('./moonpay');
var moonpay = require('lib/moonpay');
var getWallet = require('lib/wallet').getWallet;
var showConfirmPurchase = require('widgets/modals/moonpay/confirm-purchase');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
  });

  var exchanges = {
    changelly: initChangelly(ractive.find('#exchange_changelly')),
    shapeshift: initShapeshift(ractive.find('#exchange_shapeshift')),
    moonpay: initMoonpay(ractive.find('#exchange_moonpay')),
    none: new Ractive({
      el: ractive.find('#exchange_none'),
      template: require('./choose.ract'),
      data: {
        choose: choose,
        crypto: '',
        isSupportedMoonpay: false,
      },
    }),
  };

  exchanges.none.on('moonpay', function() {
    var wallet = getWallet();
    var symbol = wallet.denomination;
    moonpay.show(symbol.toLowerCase(), wallet.getNextAddress(), function() {
      showConfirmPurchase({ status: 'success' });
    });
  });

  var currentExchange = exchanges.none;

  ractive.on('before-show', function() {
    setMoonpayButton();
    if (process.env.BUILD_PLATFORM === 'mas') return showExchange(exchanges.none);

    var preferredExchange = window.localStorage.getItem('_cs_preferred_exchange');
    if (exchanges[preferredExchange]) {
      showExchange(exchanges[preferredExchange]);
    } else {
      showExchange(exchanges.none);
    }
  });

  ractive.on('before-hide', function() {
    currentExchange.hide();
  });

  emitter.on('moonpay-init', setMoonpayButton);

  emitter.on('set-exchange', function(exchangeName) {
    choose(exchangeName);
  });

  function choose(exchangeName) {
    window.localStorage.setItem('_cs_preferred_exchange', exchangeName);
    showExchange(exchanges[exchangeName]);
  }

  function setMoonpayButton() {
    var wallet = getWallet();
    var symbol = wallet.denomination;
    exchanges.none.set('crypto', wallet.name);
    exchanges.none.set('isSupportedMoonpay', moonpay.isSupported(symbol) && wallet.getNextAddress());
  }

  function showExchange(exchange) {
    setTimeout(function() {
      currentExchange.hide();
      exchange.show();
      currentExchange = exchange;
    });
  }

  return ractive;
};
