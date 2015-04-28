'use strict';

var Velocity = require('./index.js')
var fadeOut = require('./fade.js').fadeOut

function animateLogo(elems, noSmil) {
  if (!noSmil) return;
  elems.body.removeAttribute('transform');
  elems.border.removeAttribute('transform');
  Velocity.animate(elems.body, {opacity: 1}, {duration: 1000});
  Velocity.animate(elems.border, {opacity: 1}, {duration: 1000});
  var logoAnimation = document.getElementById('logo_svg_icon');
  logoAnimation.parentNode.removeChild(logoAnimation);
  require('./fakesmile.js')
}

module.exports =  {
  animateLogo: animateLogo,
  out: function(container) {
    fadeOut(container, function() {
      window.initCSApp()
    })
  }
}
