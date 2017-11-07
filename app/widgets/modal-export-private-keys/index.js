'use strict';

var Ractive = require('widgets/modal');
var emitter = require('lib/emitter');
var isOpen = false;

function open() {
  if (isOpen) return;
  isOpen = true;

  var ractive = new Ractive({
    el: document.getElementById('flash-modal'),
    partials: {
      content: require('./content.ract')
    },
    data: {
      isShown: false,
      privateKeys: '',
      onDismiss: function() {
        isOpen = false;
      },
    }
  });

  ractive.on('close', function(){
    ractive.fire('cancel');
  });

  ractive.on('show-keys', function() {
    console.log('show keys');
    ractive.set('isShown', true);
  });

  ractive.on('export-keys', function() {
    console.log('export-keys');
  });

  return ractive;
}

module.exports = open;
