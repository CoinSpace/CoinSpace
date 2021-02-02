'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const { initWallet } = require('lib/wallet');
const { getWallet } = require('lib/wallet');
const { toUnitString, cryptoToFiat } = require('lib/convert');
const details = require('lib/wallet/details');
const ticker = require('lib/ticker-api');
const { getCrypto } = require('lib/crypto');

module.exports = function(el) {

  const state = {
    rates: ticker.getRates()[getCrypto()._id] || {},
    currency: details.get('systemInfo').preferredCurrency,
    showFiat: false,
  };

  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      isSyncing: true,
      amount: '',
      currency: '',
    },
  });

  function updateBalance() {
    const balance = getWallet().getBalance();
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

  emitter.on('rates-updated', (rates) => {
    state.rates = rates[getCrypto()._id] || {};
    updateBalance();
  });

  return ractive;
};
