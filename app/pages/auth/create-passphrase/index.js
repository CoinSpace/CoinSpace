'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const _ = require('lodash');
const Clipboard = require('clipboard');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      passphrase: '',
      isCopied: false,
      checked: false,
      termsChecked: false,
      IS_CLIPBOARD_SUPPORTED: Clipboard.isSupported(),
    },
  });

  ractive.on('before-show', (context) => {
    ractive.set('passphrase', context.passphrase);
    ractive.set('checked', context.checked);
    ractive.set('termsChecked', context.termsChecked);
  });

  if (ractive.get('IS_CLIPBOARD_SUPPORTED')) {
    const clipboard = new Clipboard(ractive.find('.js-passphrase'));
    clipboard.on('success', () => {
      if (ractive.get('isCopied')) return;
      ractive.set('isCopied', true);
      setTimeout(() => {
        ractive.set('isCopied', false);
      }, 1000);
    });
  }

  ractive.on('toggle-check', () => {
    ractive.set('checked', !ractive.get('checked'));
  });

  ractive.on('toggle-terms-check', () => {
    ractive.set('termsChecked', !ractive.get('termsChecked'));
  });

  ractive.on('confirm', () => {
    const randomIndexes = _.shuffle(_.range(12));
    emitter.emit('change-auth-step', 'createPassphraseConfirm', {
      randomIndexes,
      passphrase: ractive.get('passphrase'),
    });
  });

  ractive.on('back', () => {
    emitter.emit('change-auth-step', 'create');
  });

  return ractive;
};

