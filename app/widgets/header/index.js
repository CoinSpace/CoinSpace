'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const { initWallet } = require('lib/wallet');
const { getWallet } = require('lib/wallet');
const { toUnit, toUnitString } = require('lib/convert');
const Big = require('big.js');
const details = require('lib/wallet/details');
const ticker = require('lib/ticker-api');
const { getCrypto } = require('lib/crypto');

module.exports = function(el) {

  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      toUnitString,
      isSyncing: true,
      rates: ticker.getRates()[getCrypto()._id] || {},
      cryptoToFiat,
      currency: details.get('systemInfo').preferredCurrency,
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
        initWallet();
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

  emitter.on('currency-changed', (currency) => {
    ractive.set('currency', currency);
  });

  emitter.on('rates-updated', (rates) => {
    ractive.set('rates', rates[getCrypto()._id] || {});
  });

  function cryptoToFiat(amount) {
    const exchangeRate = ractive.get('rates')[ractive.get('currency')];
    if (amount == undefined || exchangeRate == undefined) return '⚠️';

    const btc = toUnit(amount);
    return Big(exchangeRate).times(btc).toFixed(2);
  }

  return ractive;
};
