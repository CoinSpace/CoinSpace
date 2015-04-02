'use strict';

var Velocity = require('./index.js')

function fadeAnimation(el, props, options, callback) {
  Velocity.animate(el, props, {
    easing: 'ease',
    duration: 300,
    display: options.display,
    complete: function() {
      if(callback !== undefined) {
        callback()
      }
    }
  })
}

module.exports = {
  fadeIn: function(el, callback) {
    var props = {
      opacity: 1.0
    }
    var options = {
      display: 'block'
    }
    fadeAnimation(el, props, options, callback)
  },

  fadeOut: function(el, callback) {
    var props = {
      opacity: 0
    }
    var options = {
      display: 'none'
    }
    fadeAnimation(el, props, options, callback)
  }
}

