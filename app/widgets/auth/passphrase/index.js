'use strict';

var CS = require('lib/wallet')
var Ractive = require('../auth');
var pinPage = require('../pin');
var showError = require('widgets/modals/flash').showError;

function enterPassphrase(prevPage) {
  var ractive = new Ractive({
    partials: {
      header: require('./header.ract'),
      content: require('./content.ract'),
      actions: require('./actions.ract'),
      footer: require('./footer.ract')
    },
    data: {
      passphrase: ''
    }
  });

  ractive.on('back', function() {
    if (prevPage) prevPage();
  });

  ractive.on('open-wallet-with-passphrase', function() {
    var passphrase = ractive.get('passphrase').toLowerCase().trim();

    if (passphrase !== '') {
      CS.createWallet(passphrase, ractive.getTokenNetwork(), onWalletCreated);
      ractive.set('opening', true);
      ractive.set('progress', 'Checking passphrase');
    }
  })

  ractive.on('clearPassphrase', function() {
    var passfield = ractive.find('#passphraseField');
    ractive.set('passphrase', '');
    passfield.focus();
  })

  function onWalletCreated(err, data) {
    ractive.set('opening', false);

    if (err) {
      return showError(err);
    }

    pinPage(function() {
      enterPassphrase(prevPage);
    }, data);
  }

  return ractive;
}

module.exports = enterPassphrase;
