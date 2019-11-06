'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var moonpay = require('lib/moonpay');
var showAddCreditCard = require('widgets/modals/moonpay/add-credit-card');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
    },
    partials: {
      loader: require('../loader.ract'),
    }
  });

  ractive.on('before-show', function() {
    // ractive.set('isLoading', true);
    ractive.set('isLoading', false);
  });

  ractive.on('back', function() {
    emitter.emit('change-moonpay-step', 'main');
  });

  ractive.on('add', function() {
    showAddCreditCard();
  });

  return ractive;
}
