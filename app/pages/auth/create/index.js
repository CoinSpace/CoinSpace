'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const CS = require('lib/wallet');
const { showError } = require('widgets/modals/flash');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      isLoading: false,
    },
  });

  ractive.on('before-show', () => {
    ractive.set('isLoading', false);
  });

  ractive.on('generate-phrase', async () => {
    ractive.set('isLoading', true);
    try {
      const data = await CS.createWallet(null);
      emitter.emit('change-auth-step', 'createPassphrase', {
        passphrase: data.mnemonic,
      });
    } catch (err) {
      ractive.set('isLoading', false);
      showError(err);
    }
  });

  ractive.on('back', () => {
    emitter.emit('change-auth-step', 'choose');
  });

  return ractive;
};

