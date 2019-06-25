'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');

module.exports = function (el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {}
  });

  ractive.on('back', function(context) {
    context.original.preventDefault()
    emitter.emit('toggle-terms', false)
    emitter.emit('toggle-menu', true)
  });

  emitter.on('toggle-terms', function(open) {
    ractive.el.classList.add('terms-open')
    if (open) {
      ractive.el.classList.remove('closed')
    } else {
      ractive.el.classList.add('closed')
      ractive.el.classList.remove('terms-open')
    }
  });

  return ractive;
}
