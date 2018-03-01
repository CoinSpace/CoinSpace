'use strict';

var Ractive = require('lib/ractive')
var emitter = require('lib/emitter')
var sync = require('lib/wallet').sync
var getWallet = require('lib/wallet').getWallet
var toUnit = require('lib/convert').toUnit
var toUnitString = require('lib/convert').toUnitString
var toFixedFloor = require('lib/convert').toFixedFloor
var Big = require('big.js')
var showError = require('widgets/modal-flash').showError
var db = require('lib/db')
var getNetwork = require('lib/network')
var currencies = require('lib/ticker-api').currencies(getNetwork())

var WatchModule = require('lib/apple-watch')

module.exports = function(el){
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      updating_transactions: true,
      toUnitString: toUnitString,
      menuOpen: false,
      exchangeRates: {},
      currencies: currencies,
      bitcoinToFiat: bitcoinToFiat,
      bitcoinPrice: bitcoinPrice,
      selectedFiat: '',
      cropBalance: function(amount) {
        if(amount > 0.0001) {
          return toFixedFloor(amount, 4)
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

  emitter.once('db-ready', function(){
    var systemInfo = db.get('systemInfo');
    var preferredCurrency = systemInfo.preferredCurrency;
    if (currencies.indexOf(preferredCurrency) === -1) {
      preferredCurrency = 'USD';
    }
    ractive.set('selectedFiat', preferredCurrency)
    sendIosCurrency(preferredCurrency)
    ractive.observe('selectedFiat', setPreferredCurrency)
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

  function cancelSpinner() {
    ractive.set('updating_transactions', false)
    refreshEl.classList.remove('loading')
    // IE fix
    var clone = refreshEl.cloneNode(true)
    refreshEl.parentNode.replaceChild(clone, refreshEl)
    refreshEl = clone
  }

  emitter.on('set-transactions', function() {
    cancelSpinner();
  })

  ractive.on('sync', function(context){
    context.original.preventDefault();
    if(!ractive.get('updating_transactions')) {
      ractive.set('updating_transactions', true)
      emitter.emit('sync-click')
      refreshEl.classList.add('loading');
      setTimeout(function() {
        sync(function(err){
          if(err) return showError({message: err.message})
          emitter.emit('update-balance')
        }, function(err, txs) {
          if(err) {
            emitter.emit('set-transactions', [])
            return showError({message: err.message})
          }
          emitter.emit('set-transactions', txs)
        })
      }, 200)
    }
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

  emitter.on('ticker', function(rates){
    ractive.set('exchangeRates', rates)
  })

  function bitcoinToFiat(amount, exchangeRate) {
    if(amount == undefined || exchangeRate == undefined) return "N/A";

    var btc = toUnit(amount)
    return new Big(exchangeRate).times(btc).toFixed(2)
  }

  function bitcoinPrice(exchangeRate) {
    if (!exchangeRate) return '';
    return new Big(exchangeRate).times(1).toFixed(2)
  }

  function setPreferredCurrency(currency, old){
    if (old == undefined) return; // when loading wallet

    emitter.emit('header-fiat-changed', currency)
    sendIosCurrency(currency)

    db.set('systemInfo', {preferredCurrency: currency}).catch(function(err) {
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
