'use strict';

const Ractive = require('../auth');
const _ = require('lodash');
const createPassphraseConfirmPage = require('../create-passphrase-confirm');
const Clipboard = require('clipboard');

function confirm(prevPage, data) {
  const ractive = new Ractive({
    partials: {
      header: require('./header.ract'),
      actions: require('./actions.ract'),
      footer: require('./footer.ract'),
    },
    data: {
      passphrase: data.mnemonic,
      isCopied: false,
      isClipboardEnabled: Clipboard.isSupported(),
      checked: false,
      termsChecked: false,
    },
  });

  const clipboard = new Clipboard(ractive.find('#js-passphrase'));
  clipboard.on('success', () => {
    ractive.set('isCopied', true);
    setTimeout(() => {
      ractive.set('isCopied', false);
    }, 1000);
  });

  ractive.on('toggle-check', () => {
    ractive.set('checked', !ractive.get('checked'));
  });

  ractive.on('toggle-terms-check', () => {
    ractive.set('termsChecked', !ractive.get('termsChecked'));
  });

  ractive.on('confirm', () => {
    data.randomIndexes = _.shuffle(_.range(12));
    createPassphraseConfirmPage(() => {
      confirm(prevPage, data);
    }, data);
  });

  ractive.on('back', () => {
    if (prevPage) prevPage();
  });

  return ractive;
}

module.exports = confirm;
