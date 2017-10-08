'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      qrScannerAvailable: true,
      isValidating: false
    }
  });

  ractive.on('help', function() {
    console.log('help');
  });

  ractive.on('swap', function() {
    console.log('swap');
  });

  ractive.on('confirm', function() {
    console.log('confirm');

    ractive.set('isValidating', true);
    setTimeout(function() {
      emitter.emit('set-exchange-awaiting-deposit', {
        depositAddress: 'LfmssDyX6iZvbVqHv6t9P6JWXia2JG7mdb',
        depositSymbol: 'LTC',
        depositMax: '13.4868',
        depositMin: '0.02299247 LTC',
        toSymbol: 'BTC',
        toAddress: '1N4h6WwnUaVgoDSh1X4cAcq294N1sKnwm1',
      });
      emitter.emit('change-exchange-step', 'awaitingDeposit');
      ractive.set('isValidating', false);
    }, 300);
  });

  return ractive;
}
