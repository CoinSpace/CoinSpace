'use strict';

var Velocity = require('./index.js')
var fadeOut = require('./fade.js').fadeOut

function animateLogo(elems, noSmil) {
  if (!noSmil) return 4500;
  // remove transform attribute
  for (var prop in elems) {
    if (elems.hasOwnProperty(prop)) {
      elems[prop].removeAttribute('transform');
    }
  }
  Velocity.animate(elems.body, {opacity: 1}, {duration: 1000});
  Velocity.animate(elems.border, {opacity: 1}, {duration: 1000});
  Velocity.animate(elems.coin, {opacity: 1}, {delay: 1000, duration: 1000});
  Velocity.animate(elems.space, {opacity: 1}, {delay: 2000, duration: 1000});
  Velocity.animate(elems.dot, {opacity: 1}, {delay: 3000, duration: 500});
  return 3500;
}

module.exports =  {
  animateLogo: animateLogo,
  out: function(container) {
    fadeOut(container, function() {
      window.initCSApp()
    })
  }
}
