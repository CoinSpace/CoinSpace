'use strict';

const Velocity = require('velocity-animate');

function fadeAnimation(el, props, options, callback) {
  if (options.duration === 0) {
    el.style.display = 'block';
    el.style.opacity = 1.0;
    if (callback !== undefined) {
      callback();
    }
    return true;
  }
  Velocity.animate(el, props, {
    easing: 'ease',
    duration: options.duration,
    display: options.display,
    complete() {
      if (callback !== undefined) {
        callback();
      }
    },
  });
}

module.exports = {
  fadeIn(el, { duration = 300 } = {}, callback) {
    const options = { display: 'block', duration };
    const props = {
      opacity: 1.0,
    };
    fadeAnimation(el, props, options, callback);
  },

  fadeOut(el, callback) {
    const props = {
      opacity: 0,
    };
    const options = {
      display: 'none',
      duration: 300,
    };
    fadeAnimation(el, props, options, callback);
  },
};

