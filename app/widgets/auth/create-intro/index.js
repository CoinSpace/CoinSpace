'use strict';

const Ractive = require('../auth');
const CS = require('lib/wallet');
const createPassphrasePage = require('../create-passphrase');
const { showError } = require('widgets/modals/flash');

module.exports = function createIntro(prevPage) {
  const ractive = new Ractive({
    partials: {
      header: require('./header.ract'),
      actions: require('./actions.ract'),
      footer: require('./footer.ract'),
    },
  });

  ractive.on('back', () => {
    if (prevPage) prevPage();
  });

  ractive.on('generate-phrase', () => {
    ractive.set('opening', true);
    ractive.set('progress', 'Generating');
    CS.createWallet(null, ractive.getTokenNetwork(), (err, data) => {
      if (err) return showError(err);
      createPassphrasePage(() => {
        createIntro(prevPage);
      }, data);
    });
  });

  return ractive;
};

