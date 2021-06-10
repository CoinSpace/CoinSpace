import Ractive from 'lib/ractive';
import showRemoveConfirmation from 'widgets/modals/confirm-remove';
import { getCrypto, setCrypto } from 'lib/crypto';
import { initWallet } from 'lib/wallet';
import emitter from 'lib/emitter';
import details from 'lib/wallet/details';
import ticker from 'lib/ticker-api';
import _ from 'lodash';
import { walletCoins } from 'lib/crypto';
import { cryptoToFiat } from 'lib/convert';
import bip21 from 'lib/bip21';
import template from './index.ract';

let isEnabled = false;

function isCryptoEqual(a, b) {
  return a && b && (a === b._id || _.isEqual(a, b));
}

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
    data: {
      currentCrypto: null,
      currency: null,
      rates: ticker.getAllRates(),
      isCurrentCrypto(crypto) {
        return isCryptoEqual(crypto, this.get('currentCrypto'));
      },
      getPrice(cryptoId) {
        if (cryptoId) {
          const rates = ractive.get('rates')[cryptoId] || {};
          const currency = this.get('currency');
          if (rates[currency]) {
            return `${cryptoToFiat(1, rates[currency]) || '⚠️'} ${currency}`;
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

  bip21.registerProtocolHandler(getCrypto().network);

  emitter.on('sync', () => {
    isEnabled = false;
  });

  emitter.on('wallet-ready', () => {
    isEnabled = true;
    ractive.set('rates', ticker.getAllRates());
  });

  emitter.on('wallet-error', () => {
    isEnabled = true;
    ractive.set('rates', ticker.getAllRates());
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
    const currentCrypto = getCrypto();
    ractive.set('currentCrypto', currentCrypto);
    bip21.registerProtocolHandler(currentCrypto.network);

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
}
