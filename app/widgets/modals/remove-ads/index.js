'use strict';

var Ractive = require('widgets/modals/base');
var emitter = require('lib/emitter');
var isOpen = false;
var ractive;

function open(config) {
  if (isOpen) return;
  isOpen = true;

  ractive = new Ractive({
    el: document.getElementById('flash-modal'),
    partials: {
      content: require('./content.ract')
    },
    data: {
      isLoading: false,
      onDismiss: onDismiss,
      price: config.price,
      priceSubscription: config.priceSubscription,
      isIOS: process.env.BUILD_PLATFORM === 'ios'
    }
  });

  function onDismiss() {
    isOpen = false;
    if (config.onDismiss) config.onDismiss();
  }

  ractive.on('close', function(){
    ractive.fire('cancel');
  });

  ractive.on('buy', function() {
    ractive.set('isLoading', true);
    config.buyAdFree();
  });

  ractive.on('buy-subscription', function() {
    ractive.set('isLoading', true);
    config.buyAdFreeSubscription();
  });

  return ractive;
}

emitter.on('ad-free-cancel-loading', function() {
  if (!ractive) return;
  ractive.set('isLoading', false);
});

emitter.on('ad-free-owned', function() {
  if (!ractive) return;
  ractive.set('isLoading', true);
  ractive.fire('cancel');
});

module.exports = open;
