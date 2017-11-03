'use strict';

var Velocity = require('velocity-animate');

function fadeAnimation(el, props, options, callback) {
  Velocity.animate(el, props, {
    easing: 'ease',
    duration: options.duration,
    display: options.display,
    complete: function() {
      if(callback !== undefined) {
        callback()
      }
    }
  })
}

module.exports = {
  fadeIn: function(el, duration, callback) {
    if (typeof duration === 'function') {
      callback = duration;
      duration = false;
    }
    var options = {
      display: 'block',
      duration: typeof duration === 'number' ? duration : 300
    }
    var props = {
      opacity: 1.0
    }
    fadeAnimation(el, props, options, callback)
  },

  fadeOut: function(el, callback) {
    var props = {
      opacity: 0
    }
    var options = {
      display: 'none',
      duration: 300
    }
    fadeAnimation(el, props, options, callback)
  }
}

