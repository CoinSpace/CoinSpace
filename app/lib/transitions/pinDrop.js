'use strict';

const Velocity = require('velocity-animate');
let pulseInterval;

function reset(pinEl, callback) {
  clearInterval(pulseInterval);
  if (pinEl !== undefined) {
    Velocity.animate(pinEl, { translateY: '-100%' }, {
      duration: 0,
      complete() {
        if (callback) callback();
      },
    });
  }
}

function drop(pinEl, pulseEl, callback) {
  Velocity.animate(pinEl, { translateY: 0 }, {
    easing: [400, 28],
    duration: 400,
    delay: 500,
    complete() {
      if (callback) callback();
    },
  });
  pulseInterval = setInterval(()=> {
    pulse(pulseEl);
  }, 850);
}

function pulse(pulseEl) {
  // reset at the start
  Velocity.animate(pulseEl, {
    opacity: 1,
    scale: 0.1,
  }, {
    duration: 0,
    complete() {
      Velocity.animate(pulseEl, {
        opacity: 0,
        scale: 1.0,
      }, {
        easing: "ease-out",
        duration: 800,
      });
    },
  });
}

module.exports = {
  reset,
  drop,
};


