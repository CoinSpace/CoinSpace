'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {},
    partials: {
      footer: require('../footer.ract'),
    },
  });

  const delay = 60 * 1000; // 60 seconds
  let interval;

  ractive.on('before-show', () => {
    interval = setInterval(() => {
      emitter.emit('shapeshift');
    }, delay);
  });

  ractive.on('before-hide', () => {
    clearInterval(interval);
  });

  return ractive;
};
