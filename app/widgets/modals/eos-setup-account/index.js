'use strict';

const Ractive = require('widgets/modals/base');
const { getWallet } = require('lib/wallet');
const { initWallet } = require('lib/wallet');
const details = require('lib/wallet/details');
const { showError, showSuccess } = require('widgets/modals/flash');
const emitter = require('lib/emitter');

function open() {
  const ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
    },
    data: {
      isLoading: false,
      accountName: '',
      showInstruction: false,
      price: '',
      memo: '',
      isPhonegap: process.env.BUILD_TYPE === 'phonegap',
    },
  });

  ractive.on('confirm', () => {
    ractive.set('isLoading', true);
    const wallet = getWallet();
    const accountName = ractive.get('accountName').trim();
    wallet.setupAccount(accountName).then((result) => {
      ractive.set('isLoading', false);
      if (result.needToCreateAccount) {
        ractive.set('showInstruction', true);
        ractive.set('price', result.price + ' EOS');
        ractive.set('memo', result.memo);
      } else {
        details.set('eosAccountName', accountName).then(() => {
          showSuccess({ el: ractive.el, message: 'Account has been successfully set up', fadeInDuration: 0 });
          syncWallet();
        });
      }
    }).catch((err) => {
      ractive.set('isLoading', false);
      if (/Invalid account name/.test(err.message)) {
        return showError({ message: 'Invalid account name' });
      } else if (/Account name is already taken/.test(err.message)) {
        return showError({ message: 'This account name is already taken, please choose another one.' });
      } else if (err.message === 'cs-node-error') {
        return showError({
          message: 'Network node error. Please try again later.',
          interpolations: { network: 'EOS' },
        });
      }
      console.error(err.message);
      return showError({ message: err.message });
    });
  });

  function syncWallet() {
    emitter.emit('sync');
    setTimeout(() => {
      initWallet();
    }, 200);
  }

  ractive.on('clearAccountName', () => {
    const input = ractive.find('#account_name');
    ractive.set('accountName', '');
    input.focus();
  });

  ractive.on('share-memo', () => {
    window.plugins.socialsharing.shareWithOptions({
      message: ractive.get('memo'),
    });
  });
  ractive.on('share-address', () => {
    window.plugins.socialsharing.shareWithOptions({
      message: 'coinappsetup',
    });
  });

  ractive.on('back', () => {
    ractive.set('showInstruction', false);
  });

  return ractive;
}

module.exports = open;
