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
      CS.createWallet(passphrase, ractive.getTokenNetwork(), onWalletCreated);
      ractive.set('opening', true);
      ractive.set('progress', 'Checking passphrase');
    }
  });

  ractive.on('clearPassphrase', () => {
    const passfield = ractive.find('#passphraseField');
    ractive.set('passphrase', '');
    passfield.focus();
  });

  function onWalletCreated(err, data) {
    ractive.set('opening', false);

    if (err) {
      return showError(err);
    }

    pinPage(() => {
      enterPassphrase(prevPage);
    }, data);
  }

  return ractive;
}

module.exports = enterPassphrase;
