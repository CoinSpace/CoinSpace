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

  ractive.on('generate-phrase', () => {
    ractive.set('isLoading', true);
    CS.createWallet(null)
      .then((data) => {
        emitter.emit('change-auth-step', 'createPassphrase', {
          passphrase: data.mnemonic,
        });
      })
      .catch(showError);
  });

  ractive.on('back', () => {
    emitter.emit('change-auth-step', 'choose');
  });

  return ractive;
};

