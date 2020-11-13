'use strict';

const Ractive = require('lib/ractive');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      version: process.env.VERSION,
      commit: process.env.COMMIT,
    },
  });

  ractive.on('back', () => {
    ractive.fire('change-step', { step: 'main' });
  });

  ractive.on('terms', () => {
    window.safeOpen('https://coin.space/terms-of-service/', '_blank');
  });

  ractive.on('privacy', () => {
    window.safeOpen('https://coin.space/coinprivacypolicy/', '_blank');
  });

  return ractive;
};
