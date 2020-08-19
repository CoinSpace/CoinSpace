'use strict';

const Velocity = require('velocity-animate');
let spinInterval;

function spin(el) {

  const animation = function() {
    Velocity.animate(el, { rotateZ: ['360deg', '0deg'] }, {
      duration: 1000,
      easing: 'linear',
    });
  };

  animation();
  spinInterval = setInterval(animation, 1000);
}

function stop() {
  clearInterval(spinInterval);
}

module.exports = {
  stop,
  spin,
};
