'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var sync = require('lib/wallet').sync;
var getWallet = require('lib/wallet').getWallet;
var toUnit = require('lib/convert').toUnit;
var toUnitString = require('lib/convert').toUnitString;
var Big = require('big.js');
var db = require('lib/db');
var onSyncDoneWrapper = require('lib/wallet/utils').onSyncDoneWrapper;
var onTxSyncDoneWrapper = require('lib/wallet/utils').onTxSyncDoneWrapper;

module.exports = function(el) {
  var selectedFiat = '';
  var defaultFiat = 'USD';

  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      toUnitString: toUnitString,
      menuOpen: false,
      isSyncing: true,
      exchangeRates: {},
      currencies: [],
      bitcoinToFiat: bitcoinToFiat,
      bitcoinPrice: bitcoinPrice,
      selectedFiat: defaultFiat,
      cropBalance: function(amount) {
        var dotIndex;
        if (amount > 0.0001 && (dotIndex = amount.indexOf('.')) !== -1 ) {
          return amount.substring(0, dotIndex + 5);
        } else {
          return amount;
        }
      }
    }
  })

  emitter.on('wallet-ready', function(){
    console.log('on wallet-ready event')
    var balance = getWallet().getBalance()
    ractive.set('bitcoinBalance', balance)
    ractive.set('denomination', getWallet().denomination)
  })

  emitter.on('update-balance', function() {
    ractive.set('bitcoinBalance', getWallet().getBalance())
  })

  ractive.on('toggle', function(){
    window.scrollTo(0, 0);
    emitter.emit('toggle-menu', !ractive.get('menuOpen'))
  })

  function toggleIcon(open){
    ractive.set('menuOpen', open)
  }

  var refreshEl = ractive.find('#refresh_el')

  emitter.on('set-transactions', function() {
    ractive.set('isSyncing', false);
    refreshEl.classList.remove('loading')
    // IE fix
    var clone = refreshEl.cloneNode(true)
    refreshEl.parentNode.replaceChild(clone, refreshEl)
    refreshEl = clone
  })

  ractive.on('sync-click', function(context) {
    context.original.preventDefault();
    if (!ractive.get('isSyncing')) {
      emitter.emit('sync')
      setTimeout(function() {
        var onSyncDone = onSyncDoneWrapper({
          success: function() {
            emitter.emit('update-balance');
            emitter.emit('wallet-unblock');
          }
        });
        var onTxSyncDone = onTxSyncDoneWrapper();
        sync(onSyncDone, onTxSyncDone);
      }, 200)
    }
  })

  emitter.on('sync', function() {
    ractive.set('isSyncing', true);
    refreshEl.classList.add('loading');
  })

  ractive.on('toggle-currencies', function(){
    if(ractive.get('showFiat')) {
      ractive.set('showFiat', false)
    } else {
      ractive.set('showFiat', true)
    }
  })

  emitter.on('send-fiat-changed', function(currency){
    ractive.set('selectedFiat', currency)
  })

  emitter.once('ticker', function(rates) {
    var currencies = Object.keys(rates);
    initPreferredCurrency(currencies);
    ractive.set('currencies', currencies);
    ractive.set('exchangeRates', rates);

    emitter.on('ticker', function(rates) {
      var currencies = Object.keys(rates);
      if (currencies.indexOf(selectedFiat) === -1) {
        selectedFiat = defaultFiat;
        ractive.set('selectedFiat', selectedFiat);
      }
      ractive.set('currencies', currencies);
      ractive.set('exchangeRates', rates);
    })
  })

  function initPreferredCurrency(currencies) {
    var systemInfo = db.get('systemInfo');
    selectedFiat = systemInfo.preferredCurrency;
    if (currencies.indexOf(selectedFiat) === -1) {
      selectedFiat = defaultFiat;
    }
    ractive.set('selectedFiat', selectedFiat);
    ractive.observe('selectedFiat', setPreferredCurrency)
  }

  function bitcoinToFiat(amount, exchangeRate) {
    if(amount == undefined || exchangeRate == undefined) return "N/A";

    var btc = toUnit(amount)
    return Big(exchangeRate).times(btc).toFixed(2)
  }

  function bitcoinPrice(exchangeRate) {
    if (typeof exchangeRate !== 'number') return '';
    return Big(exchangeRate).times(1).toFixed(2)
  }

  function setPreferredCurrency(currency, old) {
    if (old === undefined) return; // when loading wallet

    selectedFiat = currency;
    emitter.emit('header-fiat-changed', selectedFiat)

    db.set('systemInfo', {preferredCurrency: selectedFiat}).catch(function(err) {
      console.error(err);
    });
  }

  ractive.toggleIcon = toggleIcon

  return ractive
}
