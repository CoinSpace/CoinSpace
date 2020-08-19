'use strict';

const Ractive = require('widgets/modals/base');
const { getWallet } = require('lib/wallet');
const { showInfo } = require('widgets/modals/flash');

function open() {
  const ractive = new Ractive({
    el: document.getElementById('flash-modal'),
    partials: {
      content: require('./content.ract'),
    },
    data: {
      isShown: false,
      privateKeys: '',
      isPhonegap: process.env.BUILD_TYPE === 'phonegap',
    },
  });

  ractive.on('close', ()=> {
    ractive.fire('cancel');
  });

  ractive.on('show-keys', () => {
    const privateKeys = getWallet().exportPrivateKeys();
    if (privateKeys.length === 0) {
      ractive.fire('cancel');
      return showInfo({
        message: 'Your wallet has no private keys with coins for export.',
        fadeInDuration: 0,
      });
    }
    ractive.set('privateKeys', privateKeys);
    ractive.set('isShown', true);
  });

  ractive.on('export-keys', () => {
    window.plugins.socialsharing.shareWithOptions({
      message: ractive.get('privateKeys'),
    });
  });

  return ractive;
}

module.exports = open;
