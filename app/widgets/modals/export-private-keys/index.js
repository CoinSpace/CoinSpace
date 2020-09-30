'use strict';

const Ractive = require('widgets/modals/base');
const { getWallet } = require('lib/wallet');
const { unlock, lock } = require('lib/wallet/security');
const { showInfo } = require('widgets/modals/flash');

function open() {
  const ractive = new Ractive({
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

  let isLoading = false;

  ractive.on('show-keys', async () => {
    if (isLoading) return;
    isLoading = true;

    const wallet = getWallet();
    try {
      await unlock(wallet);
      const privateKeys = wallet.exportPrivateKeys();
      lock(wallet);
      if (privateKeys.length === 0) {
        ractive.fire('cancel');
        return showInfo({
          message: 'Your wallet has no private keys with coins for export.',
          fadeInDuration: 0,
        });
      }
      ractive.set('privateKeys', privateKeys);
      ractive.set('isShown', true);
    } catch (err) {
      lock(wallet);
      if (err.message !== 'cancelled') console.error(err);
    }

    isLoading = false;
  });

  ractive.on('export-keys', () => {
    window.plugins.socialsharing.shareWithOptions({
      message: ractive.get('privateKeys'),
    });
  });

  return ractive;
}

module.exports = open;
