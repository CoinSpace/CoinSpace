'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      toSymbol: '',
      toAddress: '',
      amount: ''
    }
  });

  ractive.on('back', function() {
    console.log('back');
    emitter.emit('change-exchange-step', 'create');
  });

  emitter.on('set-exchange-complete', function(data) {
    ractive.set({
      toSymbol: data.toSymbol,
      toAddress: data.toAddress,
      amount: data.amount
    })
  });

  return ractive;
}
