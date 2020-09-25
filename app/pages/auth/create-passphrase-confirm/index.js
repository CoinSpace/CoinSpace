'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const PinWidget = require('widgets/pin');
const { translate } = require('lib/i18n');
const CS = require('lib/wallet');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      passphrase: '',
      firstWord: '',
      secondWord: '',
      randomIndexes: [],
      isCorrect() {
        const randomIndexes = this.get('randomIndexes');
        const words = this.get('passphrase').split(' ');
        const firstWord = words[randomIndexes[0]];
        const secondWord = words[randomIndexes[1]];
        return this.get('firstWord').trim() === firstWord && this.get('secondWord').trim() === secondWord;
      },
    },
  });

  ractive.on('before-show', (context) => {
    ractive.set('passphrase', context.passphrase);
    ractive.set('randomIndexes', context.randomIndexes);
    ractive.set('firstWord', '');
    ractive.set('secondWord', '');
  });

  ractive.on('clearWord', (context) => {
    const dataContext = context.node.getAttribute('data-context');
    if (dataContext === 'first-word') {
      ractive.set('firstWord', '');
      ractive.find('#first-word').focus();
    } else if (dataContext === 'second-word') {
      ractive.set('secondWord', '');
      ractive.find('#second-word').focus();
    }
  });

  ractive.on('confirm', () => {
    ractive.pinWidget = PinWidget({
      header: translate('Set a PIN for quick access'),
      headerLoading: translate('Setting PIN'),
      async onPin(pin) {
        try {
          await CS.registerWallet(pin);
          ractive.pinWidget.loadingWallet();
        } catch (err) {
          ractive.pinWidget.wrong();
          emitter.emit('auth-error', err);
        }
      }
    });
  });

  ractive.on('back', () => {
    emitter.emit('change-auth-step', 'createPassphrase', {
      passphrase: ractive.get('passphrase'),
      checked: true,
      termsChecked: true,
    });
  });

  return ractive;
};

