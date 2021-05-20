import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import { initWallet } from 'lib/wallet';
import { getWallet } from 'lib/wallet';
import { toUnitString, cryptoToFiat } from 'lib/convert';
import details from 'lib/wallet/details';
import ticker from 'lib/ticker-api';
import { getCrypto } from 'lib/crypto';
import template from './index.ract';

export default function(el) {

  const state = {
    rates: ticker.getRates(getCrypto()._id),
    currency: details.get('systemInfo').preferredCurrency,
    showFiat: false,
  };

  const ractive = new Ractive({
    el,
    template,
    data: {
      isSyncing: true,
      amount: '',
      currency: '',
    },
  });

  function updateBalance() {
    const { balance } = getWallet();
    let amount;
    let currency;
    if (state.showFiat) {
      const exchangeRate = state.rates[state.currency];
      amount = cryptoToFiat(toUnitString(balance), exchangeRate) || '⚠️';
      // eslint-disable-next-line prefer-destructuring
      currency = state.currency;
    } else {
      amount = toUnitString(balance);
      currency = getWallet().denomination;
    }
    const size = amount.length > 12 ? 'medium' : 'large';
    ractive.set({
      amount,
      currency,
      size,
    });
  }

  emitter.on('wallet-ready', () => {
    updateBalance();
    ractive.set('isSyncing', false);
  });

  emitter.on('tx-sent', () => {
    updateBalance();
  });

  emitter.on('tx-added', () => {
    updateBalance();
  });

  ractive.on('sync-click', (context) => {
    context.original.preventDefault();
    if (!ractive.get('isSyncing')) {
      emitter.emit('sync');
      setTimeout(() => {
        initWallet();
      }, 200);
    }
  });

  emitter.on('sync', () => {
    ractive.set('isSyncing', true);
  });

  ractive.on('toggle-currencies', () => {
    state.showFiat = !state.showFiat;
    updateBalance();
  });

  emitter.on('currency-changed', (currency) => {
    state.currency = currency;
    updateBalance();
  });

  emitter.on('rates-updated', () => {
    state.rates = ticker.getRates(getCrypto()._id);
    updateBalance();
  });

  return ractive;
}
