import Ractive from 'lib/ractive';
import showRemoveConfirmation from 'widgets/modals/confirm-remove';
import { walletCoins, getWallet, switchCrypto, unsetWallet } from 'lib/wallet';
import LS from 'lib/wallet/localStorage';
import emitter from 'lib/emitter';
import details from 'lib/wallet/details';
import ticker from 'lib/ticker-api';
import _ from 'lodash';
import { cryptoToFiat } from 'lib/convert';
import template from './index.ract';
import crypto from 'lib/crypto';

let isEnabled = false;

function isCryptoEqual(a, b) {
  return a && b && _.isEqual(a, b);
}

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
    data: {
      currentCrypto: null,
      currency: null,
      rates: {},
      isCurrentCrypto(crypto) {
        return isCryptoEqual(crypto, this.get('currentCrypto'));
      },
      getPrice(crypto) {
        if (!crypto.coingecko) return '⚠️';
        const rates = ractive.get('rates')[crypto._id] || {};
        const currency = this.get('currency');
        if (rates[currency]) {
          return `${cryptoToFiat(1, rates[currency]) || '⚠️'} ${currency}`;
        }
        return '...';
      },
      getLogoUrl(logo) {
        return crypto.getLogoUrl(logo);
      },
      async switchCrypto(crypto) {
        if (!isEnabled) {
          return;
        }
        await switchCrypto(crypto);
        ractive.set('currentCrypto', getWallet().crypto);
      },
      removeCryptoToken,
      cryptoCoins: [],
      cryptoTokens: [],
    },
  });

  emitter.on('sync', () => {
    isEnabled = false;
  });

  emitter.on('wallet-ready', () => {
    isEnabled = true;
  });

  emitter.on('wallet-error', () => {
    isEnabled = true;
  });

  emitter.on('currency-changed', (currency) => {
    ractive.set('currency', currency);
  });

  emitter.on('rates-updated', (rates) => {
    ractive.set('rates', rates);
  });

  ractive.on('before-show', () => {
    ractive.set('cryptoCoins', walletCoins);
    const walletTokens = details.get('tokens');
    const cryptoTokens = walletTokens
      .filter((item) => ['ethereum', 'binance-smart-chain', 'avalanche-c-chain', 'tron'].includes(item.platform));
    ractive.set('cryptoTokens', cryptoTokens);
    ractive.set('currentCrypto', getWallet().crypto);
    ractive.set('currency', details.get('systemInfo').preferredCurrency);
    ticker.init([
      ...walletCoins,
      ...walletTokens,
    ]);
  });

  function removeCryptoToken(token) {
    const rindex = ractive.get('cryptoTokens').findIndex((item) => _.isEqual(item, token));
    const walletTokens = details.get('tokens');
    showRemoveConfirmation(token.name, (modal) => {
      const index = walletTokens.findIndex((item) => _.isEqual(item, token));
      if (index === -1) return modal.fire('cancel');

      walletTokens.splice(index, 1);

      details.set('tokens', walletTokens).then(() => {
        modal.set('onDismiss', () => {
          ractive.splice('cryptoTokens', rindex, 1);
          unsetWallet(token);
          LS.unsetCache(token);
        });
        modal.fire('cancel');
      }).catch((err) => {
        console.error(err);
        modal.fire('cancel');
      });
    });
    return false;
  }

  ractive.on('addCryptoToken', (context) => {
    context.event.stopPropagation();
    emitter.emit('set-tokens', 'search');
  });

  return ractive;
}
