'use strict';

var Ractive = require('lib/ractive')
var Big = require('big.js')
var emitter = require('lib/emitter')
var db = require('lib/db')
var getWallet = require('lib/wallet').getWallet
var getNetwork = require('lib/network')
var currencies = require('lib/ticker-api').currencies(getNetwork())
var toFixedFloor = require('lib/convert').toFixedFloor
var toUnitString = require('lib/convert').toUnitString
var showError = require('widgets/modal-flash').showError
var showInfo = require('widgets/modal-flash').showInfo
var showConfirmation = require('widgets/modal-confirm-send')
var validateSend = require('lib/wallet').validateSend
var getDynamicFees = require('lib/wallet').getDynamicFees
var resolveTo = require('lib/openalias/xhr.js').resolveTo
var qrcode = require('lib/qrcode')

module.exports = function(el){
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      currencies: currencies,
      selectedFiat: '',
      exchangeRates: {},
      qrScannerAvailable: qrcode.isScanAvailable,
      toUnitString: toUnitString,
      isBitcoin: getNetwork() === 'bitcoin' || getNetwork() === 'testnet',
      isEthereum: getNetwork() === 'ethereum',
      validating: false
    }
  })

  emitter.on('prefill-wallet', function(address, context) {
    if (context !== 'send') return;
    ractive.set('to', address)
  })

  emitter.on('prefill-value', function(value, context) {
    if (context !== 'send') return;
    ractive.set('value', value)
    ractive.fire('bitcoin-to-fiat')
  })

  ractive.on('open-qr', function(){
    qrcode.scan({context: 'send', isEthereum: ractive.get('isEthereum')});
  })

  ractive.on('open-geo', function(){
    var data = {
      overlay: 'geo',
      context: 'send'
    }
    emitter.emit('open-overlay', data)
  })

  emitter.on('header-fiat-changed', function(currency) {
    ractive.set('selectedFiat', currency)
  })

  ractive.on('open-send', function(){
    ractive.set('validating', true);
    var to = ractive.get('to')
    resolveTo(to, function(data){
      to = data.to
      var alias = data.alias
      var amount = ractive.get('value')

      getDynamicFees(function(dynamicFees) {
        validateAndShowConfirm(to, amount, alias, dynamicFees)
      });
    })
  })

  emitter.on('wallet-ready', function(){
    ractive.set('denomination', getWallet().denomination)
  })

  emitter.once('db-ready', function(){
    db.get('systemInfo', function(err, info) {
      if(err) return console.error(err);
      var preferredCurrency = info.preferredCurrency;
      if (currencies.indexOf(preferredCurrency) === -1) {
        preferredCurrency = 'USD';
      }
      ractive.set('selectedFiat', preferredCurrency)
      ractive.observe('selectedFiat', setPreferredCurrency)
    })
  })

  emitter.on('ticker', function(rates){
    ractive.set('exchangeRates', rates)
  })

  ractive.on('fiat-to-bitcoin', function(){
    var fiat = ractive.find('#fiat').value
    if(fiat == undefined || fiat === '') return;

    var exchangeRate = getExchangeRate()
    if(!exchangeRate) return;

    var bitcoin = toFixedFloor(new Big(fiat).div(exchangeRate), 8)

    ractive.set('value', bitcoin)
  })

  ractive.on('bitcoin-to-fiat', function(){
    var bitcoin = ractive.find('#bitcoin').value
    if(bitcoin == undefined || bitcoin === '') return;


    var exchangeRate = getExchangeRate()
    if(!exchangeRate) return;

    var val = new Big(bitcoin).times(exchangeRate)
    var fiat = toFixedFloor(val, 2)

    ractive.set('fiatValue', fiat)
  })

  ractive.on('clearTo', function(){
    var passfield = ractive.find('#to')
    ractive.set('to', '')
    passfield.focus()
  })

  ractive.on('focusAmountInput', function(context) {
    context.node.parentNode.style.zIndex = 5000
  })

  ractive.on('blurAmountInput', function(context) {
    context.node.parentNode.style.zIndex = ''
  })

  function validateAndShowConfirm(to, amount, alias, dynamicFees) {
    validateSend(getWallet(), to, amount, function(err){
      ractive.set('validating', false);
      if(err) {
        var interpolations = err.interpolations
        if(err.message.match(/trying to empty your wallet/)){
          ractive.set('value', interpolations.sendableBalance)
          return showInfo({message: err.message, interpolations: interpolations})
        }
        return showError({title: 'Uh Oh...', message: err.message, href: err.href, linkText: err.linkText, interpolations: interpolations})
      }

      showConfirmation({
        to: to,
        alias: alias,
        amount: ractive.get('value'), // don't change this to amount. 'value' could be modified above
        denomination: ractive.get('denomination'),
        dynamicFees: dynamicFees,
        onSuccessDismiss: function() {
          ractive.set({to: '', value: '', fiatValue: ''});
        }
      })
    })
  }

  function getExchangeRate(){
    var exchangeRate = ractive.get('exchangeRates')[ractive.get('selectedFiat')]
    ractive.set("exchangeRateUnavailable", exchangeRate == undefined)
    return exchangeRate
  }

  function setPreferredCurrency(currency, old){
    if (old == undefined) return; // when loading wallet

    emitter.emit('send-fiat-changed', currency)
    ractive.fire('bitcoin-to-fiat')
  }

  return ractive
}
