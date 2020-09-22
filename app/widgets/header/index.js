'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const { sync } = require('lib/wallet');
const { getWallet } = require('lib/wallet');
const { toUnit } = require('lib/convert');
const { toUnitString } = require('lib/convert');
const Big = require('big.js');
const details = require('lib/wallet/details');

module.exports = function(el) {
  let selectedFiat = '';
  const defaultFiat = 'USD';

  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      toUnitString,
      isSyncing: true,
      exchangeRates: {},
      currencies: [],
      bitcoinToFiat,
      bitcoinPrice,
      selectedFiat: defaultFiat,
      cropBalance(amount) {
        let dotIndex;
        if (amount > 0.0001 && (dotIndex = amount.indexOf('.')) !== -1 ) {
          return amount.substring(0, dotIndex + 5);
        } else {
          return amount;
        }
      },
    },
  });

  let refreshEl = ractive.find('#refresh_el');

  emitter.on('wallet-ready', () => {
    console.log('on wallet-ready event');
    const balance = getWallet().getBalance();
    ractive.set('bitcoinBalance', balance);
    ractive.set('denomination', getWallet().denomination);
    ractive.set('isSyncing', false);
    refreshEl.classList.remove('loading');
    // IE fix
    const clone = refreshEl.cloneNode(true);
    refreshEl.parentNode.replaceChild(clone, refreshEl);
    refreshEl = clone;
  });

  emitter.on('tx-sent', () => {
    const balance = getWallet().getBalance();
    ractive.set('bitcoinBalance', balance);
  });

  ractive.on('sync-click', (context) => {
    context.original.preventDefault();
    if (!ractive.get('isSyncing')) {
      emitter.emit('sync');
      setTimeout(() => {
        sync();
      }, 200);
    }
  });

  emitter.on('sync', () => {
    ractive.set('isSyncing', true);
    refreshEl.classList.add('loading');
  });

  ractive.on('toggle-currencies', () => {
    if (ractive.get('showFiat')) {
      ractive.set('showFiat', false);
    } else {
      ractive.set('showFiat', true);
    }
  });

  emitter.on('send-fiat-changed', (currency) => {
    ractive.set('selectedFiat', currency);
  });

  emitter.once('ticker', (rates) => {
    const currencies = Object.keys(rates);
    initPreferredCurrency(currencies);
    ractive.set('currencies', currencies);
    ractive.set('exchangeRates', rates);

    emitter.on('ticker', (rates) => {
      const currencies = Object.keys(rates);
      if (currencies.indexOf(selectedFiat) === -1) {
        selectedFiat = defaultFiat;
        ractive.set('selectedFiat', selectedFiat);
      }
      ractive.set('currencies', currencies);
      ractive.set('exchangeRates', rates);
    });
  });

  function initPreferredCurrency(currencies) {
    const systemInfo = details.get('systemInfo');
    selectedFiat = systemInfo.preferredCurrency;
    if (currencies.indexOf(selectedFiat) === -1) {
      selectedFiat = defaultFiat;
    }
    ractive.set('selectedFiat', selectedFiat);
    ractive.observe('selectedFiat', setPreferredCurrency);
  }

  function bitcoinToFiat(amount, exchangeRate) {
    if (amount == undefined || exchangeRate == undefined) return "N/A";

    const btc = toUnit(amount);
    return Big(exchangeRate).times(btc).toFixed(2);
  }

  function bitcoinPrice(exchangeRate) {
    if (typeof exchangeRate !== 'number') return '';
    return Big(exchangeRate).times(1).toFixed(2);
  }

  function setPreferredCurrency(currency, old) {
    if (old === undefined) return; // when loading wallet

    selectedFiat = currency;
    emitter.emit('header-fiat-changed', selectedFiat);

    details.set('systemInfo', { preferredCurrency: selectedFiat })
      .catch((err) => {
        console.error(err);
      });
  }

  return ractive;
};
