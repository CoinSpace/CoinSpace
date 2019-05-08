'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {},
    partials: {
      footer: require('../footer.ract')
    }
  });

  var delay = 60 * 1000; // 60 seconds
  var interval;

  ractive.on('before-show', function() {
    interval = setInterval(function() {
      emitter.emit('shapeshift');
    }, delay);
  });

  ractive.on('before-hide', function() {
    clearInterval(interval);
  });

  return ractive;
}
