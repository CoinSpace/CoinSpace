'use strict';

const Ractive = require('lib/ractive');
const showRemoveConfirmation = require('widgets/modals/confirm-remove');
const { getCrypto, setCrypto } = require('lib/crypto');
const { initWallet } = require('lib/wallet');
const emitter = require('lib/emitter');
const details = require('lib/wallet/details');
const _ = require('lodash');

let isEnabled = false;

function isCryptoEqual(a, b) {
  return a && b && (a === b._id || _.isEqual(a, b));
}

module.exports = function(el) {

  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      currentCrypto: null,
      isCurrentCrypto(crypto) {
        return isCryptoEqual(crypto, this.get('currentCrypto'));
      },
      switchCrypto,
      removeEthereumToken,
      ethereumTokens: [],
    },
  });

  emitter.on('sync', () => {
    isEnabled = false;
  });

  emitter.on('wallet-ready', () => {
    isEnabled = true;
  });


  ractive.on('before-show', () => {
    const walletTokens = details.get('tokens');
    ractive.set('ethereumTokens', walletTokens.filter(item => item.network === 'ethereum'));
    ractive.set('currentCrypto', getCrypto());
  });

  function switchCrypto(crypto) {
    if (isCryptoEqual(crypto, ractive.get('currentCrypto'))) {
      return;
    }
    if (!isEnabled) return;

    setCrypto(crypto);
    ractive.set('currentCrypto', getCrypto());
    emitter.emit('sync');

    setTimeout(() => {
      initWallet();
    }, 200);
  }

  function removeEthereumToken(token) {
    const rindex = ractive.get('ethereumTokens').findIndex((item) => _.isEqual(item, token));
    const walletTokens = details.get('tokens');
    showRemoveConfirmation(token.name, (modal) => {
      const index = walletTokens.findIndex((item) => _.isEqual(item, token));
      if (index === -1) return modal.fire('cancel');

      walletTokens.splice(index, 1);

      details.set('tokens', walletTokens).then(() => {
        modal.set('onDismiss', () => {
          ractive.splice('ethereumTokens', rindex, 1);
        });
        modal.fire('cancel');
      }).catch((err) => {
        console.error(err);
        modal.fire('cancel');
      });
    });
    return false;
  }

  ractive.on('addEthereumToken', (context) => {
    context.event.stopPropagation();
    emitter.emit('set-tokens', 'search');
  });

  return ractive;
};
