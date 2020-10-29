'use strict';

const Ractive = require('lib/ractive');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      version: process.env.VERSION,
    },
  });

  ractive.on('back', () => {
    ractive.fire('change-step', { step: 'main' });
  });

  ractive.on('terms', () => {
    window.open('https://coin.space/terms-of-service/', '_blank').opener = null;
  });

  ractive.on('privacy', () => {
    window.open('https://coin.space/coinprivacypolicy/', '_blank').opener = null;
  });

  return ractive;
};
