'use strict';

var Velocity = require('velocity-animate')

module.exports = function(el) {
Velocity.animate(el, {
    outlineColorRed: 133,
    outlineColorGreen: 141,
    outlineColorBlue: 240,
    outlineColorAlpha: 1
  }, {
    duration: 0,
    complete: function() {

      Velocity.animate(el, {
        outlineColorAlpha: 0
      }, {
        easing: 'ease-out',
        duration: 300
      })

    }
  })
}
