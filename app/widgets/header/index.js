'use strict';

var Ractive = require('lib/ractive')
var emitter = require('lib/emitter')
var sync = require('lib/wallet').sync
var getWallet = require('lib/wallet').getWallet
var toUnit = require('lib/convert').toUnit
var toUnitString = require('lib/convert').toUnitString
var Big = require('big.js')
var showError = require('widgets/modals/flash').showError
var db = require('lib/db')

var WatchModule = require('lib/apple-watch')

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
        if(amount > 0.0001) {
          return new Big(amount).toFixed(4)
        } else {
          return amount
        }
      }
    }
  })

  emitter.on('wallet-ready', function(){
    console.log('on wallet-ready event')
    var balance = getWallet().getBalance()
    ractive.set('bitcoinBalance', balance)
    ractive.set('denomination', getWallet().denomination)
    if (process.env.BUILD_PLATFORM === 'ios') {
      var response = {}
      response.command = 'balanceMessage'
      response.balance = balance
      response.denomination = getWallet().denomination
      response.walletId = getWallet().getNextAddress()

      WatchModule.sendMessage(response, 'comandAnswerQueue')
    }
  })

  emitter.on('update-balance', function() {
    ractive.set('bitcoinBalance', getWallet().getBalance())
    if (process.env.BUILD_PLATFORM === 'ios') {
      var response = {}
      response.command = 'balanceMessage'
      response.balance = getWallet().getBalance()
      response.denomination = getWallet().denomination
      response.walletId = getWallet().getNextAddress()

      WatchModule.sendMessage(response, 'comandAnswerQueue')
    }
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
        sync(function(err){
          if (err) return showError({message: err.message})
          emitter.emit('update-balance')
        }, function(err, txs) {
          if (err) {
            emitter.emit('set-transactions', [])
            return showError({message: err.message})
          }
          emitter.emit('set-transactions', txs)
        })
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
    sendIosCurrency(selectedFiat)
    ractive.observe('selectedFiat', setPreferredCurrency)
  }

  function bitcoinToFiat(amount, exchangeRate) {
    if(amount == undefined || exchangeRate == undefined) return "N/A";

    var btc = toUnit(amount)
    return new Big(exchangeRate).times(btc).toFixed(2)
  }

  function bitcoinPrice(exchangeRate) {
    if (typeof exchangeRate !== 'number') return '';
    return new Big(exchangeRate).times(1).toFixed(2)
  }

  function setPreferredCurrency(currency, old) {
    if (old === undefined) return; // when loading wallet

    selectedFiat = currency;
    emitter.emit('header-fiat-changed', selectedFiat)
    sendIosCurrency(selectedFiat)

    db.set('systemInfo', {preferredCurrency: selectedFiat}).catch(function(err) {
      console.error(err);
    });
  }

  function sendIosCurrency(currency) {
    if (process.env.BUILD_PLATFORM === 'ios') {
      WatchModule.sendMessage({
        command: 'defaultCurrencyMessage',
        defaultCurrency: currency
      }, 'comandAnswerQueue')
    }
  }

  ractive.toggleIcon = toggleIcon

  return ractive
}
