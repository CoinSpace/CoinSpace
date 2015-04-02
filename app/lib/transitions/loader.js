'use strict';

var Velocity = require('./index.js')
var fadeOut = require('./fade.js').fadeOut

function animateIn(el, delay) {
  // reset at the start
  Velocity.animate(el, {
    opacity: 0,
    translateY: '-5px'
  }, {
    duration: 0,
    complete: function() {
      Velocity.animate(el, {
        opacity: 1,
        translateY: 0
      }, {
        easing: "ease",
        duration: 400,
        delay: delay
      })
    }
  })
}

module.exports =  {
  in: function(elems) {
    animateIn(elems['label'], 300)
  },
  out: function(container) {
    fadeOut(container, function() {
      window.initCSApp()
    })
  }
}
