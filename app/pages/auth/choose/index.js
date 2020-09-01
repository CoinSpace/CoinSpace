'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
  });

  ractive.on('create-new-wallet', () => {
    emitter.emit('change-auth-step', 'create');
  });

  ractive.on('reveal-passphrase-input', () => {
    console.log('reveal-passphrase-input');
  });

  return ractive;
};

