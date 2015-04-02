'use strict';

var Velocity = require('./index.js')
var spinInterval;

function spin(el) {

  var animation = function() {
    Velocity.animate(el, {rotateZ: ['360deg', '0deg']}, {
      duration: 1000,
      easing: 'linear'
    })
  }

  animation()
  spinInterval = setInterval(animation, 1000);
}

function stop() {
  clearInterval(spinInterval)
}

module.exports = {
  stop: stop,
  spin: spin
}
