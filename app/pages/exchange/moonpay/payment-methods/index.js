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
    ractive.set('isLoading', true);
    return moonpay.getCards().then(function(cards) {
      ractive.set('isLoading', false);
      console.log('cards', cards);
    }).catch(function(err) {
      ractive.set('isLoading', false);
      console.error(err);
    });
  });

  ractive.on('back', function() {
    emitter.emit('change-moonpay-step', 'main');
  });

  ractive.on('add', function() {
    showAddCreditCard({onSuccessDismiss: function() {
      ractive.show();
    }});
  });

  return ractive;
}
