'use strict';

var Ractive = require('cs-ractive')
var emitter = require('cs-emitter')
var sync = require('cs-wallet-js').sync
var getWallet = require('cs-wallet-js').getWallet
var satoshiToBtc = require('cs-convert').satoshiToBtc
var toFixedFloor = require('cs-convert').toFixedFloor
var Big = require('big.js')
var showError = require('cs-modal-flash').showError
var db = require('cs-db')
var spinner = require('cs-transitions/spinner.js')
var currencies = require('cs-ticker-api').currencies

module.exports = function(el){
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract').template,
    data: {
      satoshiToBtc: satoshiToBtc,
      menuOpen: false,
      exchangeRates: {},
      currencies: currencies,
      bitcoinToFiat: bitcoinToFiat,
      bitcoinPrice: bitcoinPrice,
      cropBalance: function(amount) {
        if(amount > 0.0001) {
          return toFixedFloor(amount, 4)
        } else {
          return amount
        }
      }
    }
  })

  emitter.on('balance-ready', function(balance) {
    ractive.set('bitcoinBalance', balance)
    ractive.set('denomination', getWallet().denomination)
    db.get('systemInfo', function(err, info){
      if(err) return console.error(err);
      ractive.set('fiatCurrency', info.preferredCurrency)
    })
  })

  emitter.on('wallet-ready', function(){
    ractive.set('bitcoinBalance', getWallet().getBalance())
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

  var refreshEl = ractive.nodes.refresh_el

  function cancelSpinner() {
    ractive.set('updating_transactions', false)
    spinner.stop(refreshEl)
  }

  ractive.on('sync', function(event){
    event.original.preventDefault();
    if(!ractive.get('updating_transactions')) {
      ractive.set('updating_transactions', true)
      spinner.spin(refreshEl)
      setTimeout(cancelSpinner, 30000)
      sync(function(err, txs){
        if(err) return showError(err)
        cancelSpinner()
        emitter.emit('update-balance')
        emitter.emit('update-transactions', txs)
      })
    }
  })

  ractive.on('toggle-currencies', function(){
    if(ractive.get('showFiat')) {
      ractive.set('showFiat', false)
    } else {
      ractive.set('showFiat', true)
    }
  })

  ractive.observe('selectedFiat', setPreferredCurrency)

  emitter.on('preferred-currency-changed', function(currency){
    ractive.set('fiatCurrency', currency)
  })

  emitter.on('ticker', function(rates){
    ractive.set('exchangeRates', rates)
  })

  function bitcoinToFiat(amount, exchangeRate) {
    if(amount == undefined || exchangeRate == undefined) return "N/A";

    var btc = satoshiToBtc(amount)
    return new Big(exchangeRate).times(btc).toFixed(2)
  }

  function bitcoinPrice(exchangeRate) {
    return new Big(exchangeRate).times(1).toFixed(2)
  }

  function setPreferredCurrency(currency, old){
    if(old == undefined) return; //when loading wallet

    db.set('systemInfo', {preferredCurrency: currency}, function(err, response){
      if(err) return console.error(response);

      emitter.emit('preferred-currency-changed', currency)
      emitter.emit('price-currency-changed', currency)
    })
  }

  ractive.toggleIcon = toggleIcon

  return ractive
}
