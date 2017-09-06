'use strict';

var Ractive = require('cs-ractive')
var Big = require('big.js')
var emitter = require('cs-emitter')
var db = require('cs-db')
var getWallet = require('cs-wallet-js').getWallet
var currencies = require('cs-ticker-api').currencies
var toFixedFloor = require('cs-convert').toFixedFloor
var toUnitString = require('cs-convert').toUnitString
var showError = require('cs-modal-flash').showError
var showInfo = require('cs-modal-flash').showInfo
var showConfirmation = require('cs-modal-confirm-send')
var validateSend = require('cs-wallet-js').validateSend
var getDynamicFees = require('cs-wallet-js').getDynamicFees
var resolveTo = require('cs-openalias/xhr.js').resolveTo
var getNetwork = require('cs-network')

module.exports = function(el){
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract').template,
    data: {
      currencies: currencies,
      exchangeRates: {},
      qrScannerAvailable: window.buildType === 'phonegap',
      toUnitString: toUnitString,
      isBitcoin: getNetwork() === 'bitcoin' || getNetwork() === 'testnet',
      isEthereum: getNetwork() === 'ethereum'
    }
  })

  emitter.on('clear-send-form', function(){
    ractive.set('to', '')
    ractive.set('value', '')
    ractive.set('fiatValue', '')
  })

  emitter.on('prefill-wallet', function(address) {
    ractive.set('to', address)
  })

  emitter.on('prefill-value', function(value) {
    ractive.set('value', value)
    ractive.fire('bitcoin-to-fiat')
  })

  ractive.on('open-qr', function(){
    if (ractive.get('qrScannerAvailable')) {
      cordova.plugins.barcodeScanner.scan(
        function(result) {
          if (result.text) {
            var address = result.text.split('?')[0].split(':').pop()

            var wallet = getWallet();
            if (ractive.get('isEthereum') && wallet.isValidIban(address)) {
              address = wallet.getAddressFromIban(address);
            }

            emitter.emit('prefill-wallet', address)

            var match = result.text.match(/amount=([0-9.]+)/)
            if (match && match[1]) {
              emitter.emit('prefill-value', match[1])
            }
          }
          if (window.FacebookAds && window.FacebookAds.fixBanner) {
            window.FacebookAds.fixBanner();
          }
        },
        function () {
          navigator.notification.alert(
            'Access to the camera has been prohibited; please enable it in the Settings app to continue',
            function(){},
            'Coin Space'
          )
        }, {showTorchButton: true})
    }
  })

  ractive.on('open-geo', function(){
    var data = {
      overlay: 'geo',
      context: 'send'
    }
    emitter.emit('open-overlay', data)
  })

  emitter.on('send-confirm-open', function() {
    ractive.set('validating', false)
  })

  emitter.on('price-currency-changed', function(currency) {
    ractive.set('selectedFiat', currency)
  })

  ractive.on('open-send', function(){
    var to = ractive.get('to')
    resolveTo(to, function(data){
      to = data.to
      var alias = data.alias
      var amount = ractive.get('value')

      if(ractive.get('isBitcoin')) {
        getDynamicFees(function(dynamicFees) {
          validateAndShowConfirm(to, amount, alias, dynamicFees)
        })
      } else {
        validateAndShowConfirm(to, amount, alias)
      }
    })
  })

  emitter.on('wallet-ready', function(){
    ractive.set('denomination', getWallet().denomination)
  })

  emitter.once('db-ready', function(){
    db.get(function(err, doc){
      if(err) return console.error(err);

      ractive.set('selectedFiat', doc.systemInfo.preferredCurrency)
      ractive.observe('selectedFiat', setPreferredCurrency)
    })
  })

  emitter.on('ticker', function(rates){
    ractive.set('exchangeRates', rates)
  })

  ractive.on('fiat-to-bitcoin', function(){
    var fiat = ractive.nodes.fiat.value
    if(fiat == undefined || fiat === '') return;

    var exchangeRate = getExchangeRate()
    if(!exchangeRate) return;

    var bitcoin = toFixedFloor(new Big(fiat).div(exchangeRate), 8)

    ractive.set('value', bitcoin)
  })

  ractive.on('bitcoin-to-fiat', function(){
    var bitcoin = ractive.nodes.bitcoin.value
    if(bitcoin == undefined || bitcoin === '') return;


    var exchangeRate = getExchangeRate()
    if(!exchangeRate) return;

    var val = new Big(bitcoin).times(exchangeRate)
    var fiat = toFixedFloor(val, 2)

    ractive.set('fiatValue', fiat)
  })

  ractive.observe('to', function(newValue) {
    if(newValue) {
      ractive.set('toEntered', true)
    } else {
      ractive.set('toEntered', false)
    }
  })

  ractive.on('clearTo', function(){
    var passfield = ractive.nodes.to
    ractive.set('to', '')
    ractive.set('toEntered', false)
    passfield.focus()
  })

  ractive.on('focusAmountInput', function(event) {
    event.node.parentNode.style.zIndex = 5000
  })

  ractive.on('blurAmountInput', function(event) {
    event.node.parentNode.style.zIndex = ''
  })

  function validateAndShowConfirm(to, amount, alias, dynamicFees) {
    validateSend(getWallet(), to, amount, function(err){
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
        dynamicFees: dynamicFees
      })
    })
  }

  function getExchangeRate(){
    var exchangeRate = ractive.get('exchangeRates')[ractive.get('selectedFiat')]
    ractive.set("exchangeRateUnavailable", exchangeRate == undefined)
    return exchangeRate
  }

  function setPreferredCurrency(currency, old){
    if(old == undefined) return; //when loading wallet

    emitter.emit('preferred-currency-changed', currency)
    ractive.fire('bitcoin-to-fiat')
  }

  return ractive
}
