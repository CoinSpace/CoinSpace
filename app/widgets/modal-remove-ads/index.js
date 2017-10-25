'use strict';

var Ractive = require('widgets/modal');
var emitter = require('lib/emitter');
var isOpen = false;

function open(config) {
  if (isOpen) return;
  isOpen = true;

  var ractive = new Ractive({
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

  emitter.on('ad-free-cancel-loading', function() {
    ractive.set('isLoading', false);
  });

  emitter.on('ad-free-owned', function() {
    ractive.set('isLoading', true);
    ractive.fire('cancel');
  });

  return ractive;
}

module.exports = open;
