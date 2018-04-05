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
      price: config.price
    }
  });

  function onDismiss() {
    isOpen = false;
    config.onDismiss();
  }

  ractive.on('close', function(){
    ractive.fire('cancel');
  });

  ractive.on('buy', function() {
    ractive.set('isLoading', true);
    config.buy();
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
