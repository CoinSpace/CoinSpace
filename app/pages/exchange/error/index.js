'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      message: '',
    }
  });

  ractive.on('back', function() {
    console.log('back');
    emitter.emit('change-exchange-step', 'create');
  });

  emitter.on('set-exchange-error', function(error) {
    ractive.set('message', error);
  });

  return ractive;
}
