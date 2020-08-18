'use strict';

const CS = require('lib/wallet');
const Ractive = require('../auth');
const pinPage = require('../pin');
const { showError } = require('widgets/modals/flash');

function enterPassphrase(prevPage) {
  const ractive = new Ractive({
    partials: {
      header: require('./header.ract'),
      content: require('./content.ract'),
      actions: require('./actions.ract'),
      footer: require('./footer.ract'),
    },
    data: {
      passphrase: '',
    },
  });

  ractive.on('back', () => {
    if (prevPage) prevPage();
  });

  ractive.on('open-wallet-with-passphrase', () => {
    const passphrase = ractive.get('passphrase').toLowerCase().trim();

    if (passphrase !== '') {
      CS.createWallet(passphrase)
        .then((data) => {
          ractive.set('opening', false);
          pinPage(() => {
            enterPassphrase(prevPage);
          }, data);
        })
        .catch((err) => {
          ractive.set('opening', false);
          showError(err);
        });
      ractive.set('opening', true);
      ractive.set('progress', 'Checking passphrase');
    }
  });

  ractive.on('clearPassphrase', () => {
    const passfield = ractive.find('#passphraseField');
    ractive.set('passphrase', '');
    passfield.focus();
  });

  return ractive;
}

module.exports = enterPassphrase;
