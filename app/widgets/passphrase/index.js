'use strict';

const Ractive = require('lib/ractive');
const { translate } = require('lib/i18n');
const { showError } = require('widgets/modals/flash');

function open(options, callback) {
  const {
    animation = true,
    header = translate('Enter Passphrase'),
  } = options;

  const ractive = new Ractive({
    el: document.getElementById('general-purpose-overlay'),
    template: require('./index.ract'),
    data: {
      header,
      animation,
      isLoading: false,
      isOpen: false,
      passphrase: '',
      count() {
        const passphrase = this.get('passphrase').trim();
        return passphrase ? passphrase.split(' ').length : 0;
      },
    },
    oncomplete() {
      const $passphrase = ractive.find('.js-passphrase-input');
      $passphrase.focus();
      this.set('isOpen', true);
    },
    onteardown() {
      this.set('isOpen', false);
    },
  });

  ractive.on('back', () => {
    if (ractive.get('isLoading')) return;
    ractive.close();
  });

  ractive.on('clear-passphrase', () => {
    if (ractive.get('isLoading')) return;
    const $passphrase = ractive.find('.js-passphrase-input');
    ractive.set('passphrase', '');
    $passphrase.focus();
  });

  ractive.on('confirm', () => {
    const passphrase = ractive.get('passphrase').toLowerCase().trim();
    if (!passphrase) return;
    ractive.set('isLoading', true);
    callback(passphrase);
  });

  ractive.wrong = () => {
    ractive.set('isLoading', false);
    showError({ message: 'Invalid passphrase' });
  };

  ractive.close = () => {
    ractive.set('isOpen', false);
    setTimeout(() => {
      ractive.teardown();
    }, 300);
  };

  return ractive;
}
module.exports = open;
