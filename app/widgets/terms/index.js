'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var ads = require('lib/ads');

module.exports = function (el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      isAdFree: false,
      isPhonegap: process.env.BUILD_TYPE === 'phonegap'
    }
  });

  ractive.on('back', function(context) {
    context.original.preventDefault()
    emitter.emit('toggle-terms', false)
    emitter.emit('toggle-menu', true)
  });

  ractive.on('remove-ads', function(context) {
    context.original.preventDefault();
    ads.buyAdFree();
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

  emitter.on('ad-free-owned', function() {
    ractive.set('isAdFree', true);
  });

  return ractive;
}
