'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var initShapeshift = require('./shapeshift');
var initChangelly = require('./changelly');
var initMoonpay = require('./moonpay');
var moonpay = require('lib/moonpay');
var getWallet = require('lib/wallet').getWallet;

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract')
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
        isSupportedMoonpay: false
      }
    })
  }

  var currentExchange = exchanges.none;

  ractive.on('before-show', function() {
    var wallet = getWallet();
    var symbol = wallet.denomination;
    exchanges.none.set('isSupportedMoonpay', moonpay.isSupported(symbol) && wallet.getNextAddress());

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

  function choose(exchangeName) {
    window.localStorage.setItem('_cs_preferred_exchange', exchangeName);
    showExchange(exchanges[exchangeName]);
  }

  emitter.on('set-exchange', function(exchangeName) {
    choose(exchangeName);
  });

  function showExchange(exchange) {
    setTimeout(function() {
      currentExchange.hide();
      exchange.show();
      currentExchange = exchange;
    })
  }

  return ractive;
}
