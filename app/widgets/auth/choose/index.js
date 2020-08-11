'use strict';

const Ractive = require('../auth');
const passphrasePage = require('../passphrase');
const createIntroPage = require('../create-intro');

module.exports = function choose() {
  const ractive = new Ractive({
    partials: {
      actions: require('./actions.ract'),
      footer: require('./footer.ract'),
    },
    data: {
      isPhonegap: process.env.BUILD_TYPE === 'phonegap' || process.env.BUILD_TYPE === 'electron',
    },
  });

  ractive.on('create-new-wallet', () => {
    createIntroPage(choose);
  });

  ractive.on('reveal-passphrase-input', () => {
    passphrasePage(choose);
  });

  return ractive;
};

