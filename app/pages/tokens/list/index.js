'use strict';

const Ractive = require('lib/ractive');
const showRemoveConfirmation = require('widgets/modals/confirm-remove');
const { getCrypto, setCrypto } = require('lib/crypto');
const { initWallet } = require('lib/wallet');
const emitter = require('lib/emitter');
const details = require('lib/wallet/details');
const ticker = require('lib/ticker-api');
const _ = require('lodash');
const { walletCoins } = require('lib/crypto');

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
      currency: null,
      rates: ticker.getRates(),
      isCurrentCrypto(crypto) {
        return isCryptoEqual(crypto, this.get('currentCrypto'));
      },
      getPrice(cryptoId) {
        if (cryptoId) {
          const rates = ractive.get('rates')[cryptoId] || {};
          const currency = this.get('currency');
          if (rates[currency]) {
            return `${rates[currency]} ${currency}`;
          }
        }
        return '⚠️';
      },
      switchCrypto,
      removeEthereumToken,
      coins: [],
      ethereumTokens: [],
    },
  });

  emitter.on('sync', () => {
    isEnabled = false;
  });

  emitter.on('wallet-ready', () => {
    isEnabled = true;
    ractive.set('rates', ticker.getRates());
  });

  emitter.on('currency-changed', (currency) => {
    ractive.set('currency', currency);
  });

  emitter.on('rates-updated', (rates) => {
    ractive.set('rates', rates);
  });

  ractive.on('before-show', () => {
    ractive.set('coins', walletCoins);
    const walletTokens = details.get('tokens');
    ractive.set('ethereumTokens', walletTokens.filter(item => item.network === 'ethereum'));
    ractive.set('currentCrypto', getCrypto());
    ractive.set('currency', details.get('systemInfo').preferredCurrency);
    ticker.init([...walletCoins, ...walletTokens.filter((item) => item._id)]);
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
