'use strict';

var Ractive = require('lib/ractive')
var Big = require('big.js')
var emitter = require('lib/emitter')
var db = require('lib/db')
var getWallet = require('lib/wallet').getWallet
var getTokenNetwork = require('lib/token').getTokenNetwork
var showError = require('widgets/modals/flash').showError
var showInfo = require('widgets/modals/flash').showInfo
var showConfirmation = require('widgets/modals/confirm-send')
var showTooltip = require('widgets/modals/tooltip')
var validateSend = require('lib/wallet').validateSend
var getDynamicFees = require('lib/wallet').getDynamicFees
var resolveTo = require('lib/openalias/xhr.js').resolveTo
var qrcode = require('lib/qrcode')

module.exports = function(el){
  var selectedFiat = '';
  var defaultFiat = 'USD';

  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      currencies: [],
      selectedFiat: defaultFiat,
      exchangeRates: {},
      qrScannerAvailable: qrcode.isScanAvailable,
      isEthereum: false,
      validating: false,
      gasLimit: 21000
    }
  })

  emitter.on('prefill-wallet', function(address, context) {
    if (context !== 'send') return;
    ractive.set('to', address)
  })

  emitter.on('prefill-value', function(value, context) {
    if (context !== 'send') return;
    ractive.find('#bitcoin').value = value;
    ractive.fire('bitcoin-to-fiat')
  })

  ractive.on('before-show', function() {
    ractive.set('isEthereum', getTokenNetwork() === 'ethereum');
  });

  ractive.on('open-qr', function() {
    qrcode.scan({context: 'send'});
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
      var amount = ractive.find('#bitcoin').value
      // var gasLimit = ractive.find('#gas-limit').value // TODO: use it

      getDynamicFees(function(dynamicFees) {
        validateAndShowConfirm(to, amount, alias, dynamicFees)
      });
    })
  })

  emitter.on('wallet-ready', function(){
    ractive.set('denomination', getWallet().denomination)
  })

  emitter.once('ticker', function(rates) {
    var currencies = Object.keys(rates);
    initPreferredCurrency(currencies);
    ractive.set('currencies', currencies);
    ractive.set('exchangeRates', rates);
    ractive.fire('bitcoin-to-fiat');

    emitter.on('ticker', function(rates) {
      var currencies = Object.keys(rates);
      if (currencies.indexOf(selectedFiat) === -1) {
        selectedFiat = defaultFiat;
        ractive.set('selectedFiat', selectedFiat);
      }
      ractive.set('currencies', currencies);
      ractive.set('exchangeRates', rates);
      ractive.fire('bitcoin-to-fiat');
    });
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

  ractive.on('fiat-to-bitcoin', function() {
    var fiat = ractive.find('#fiat').value;
    if (!fiat) return;

    var exchangeRate = ractive.get('exchangeRates')[ractive.get('selectedFiat')];
    var bitcoin = '0';
    if (exchangeRate) {
      bitcoin = new Big(fiat).div(exchangeRate).toFixed(8)
    }
    ractive.find('#bitcoin').value = bitcoin;
  })

  ractive.on('bitcoin-to-fiat', function() {
    var bitcoin = ractive.find('#bitcoin').value;
    if (!bitcoin) return;

    var exchangeRate = ractive.get('exchangeRates')[ractive.get('selectedFiat')];
    if (typeof exchangeRate !== 'number') return;

    var fiat = new Big(bitcoin).times(exchangeRate).toFixed(2);
    ractive.find('#fiat').value = fiat;
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

  ractive.on('help-gas-limit', function() {
    showTooltip({
      message: 'Gas limit is the amount of gas to send with your transaction. ' +
      'Increasing this number will not get your transaction confirmed faster. ' +
      'Sending ETH is equal 21000. Sending Tokens is equal around 200000.'
    })
  })

  function validateAndShowConfirm(to, amount, alias, dynamicFees) {
    validateSend(getWallet(), to, amount, dynamicFees, function(err){
      ractive.set('validating', false);
      if(err) {
        var interpolations = err.interpolations
        if(err.message.match(/trying to empty your wallet/)){
          ractive.find('#bitcoin').value = interpolations.sendableBalance;
          return showInfo({message: err.message, interpolations: interpolations})
        }
        return showError({title: 'Uh Oh...', message: err.message, href: err.href, linkText: err.linkText, interpolations: interpolations})
      }

      showConfirmation({
        to: to,
        alias: alias,
        amount: ractive.find('#bitcoin').value, // don't change this to amount. 'value' could be modified above
        denomination: ractive.get('denomination'),
        dynamicFees: dynamicFees,
        onSuccessDismiss: function() {
          ractive.set({to: ''});
          ractive.find('#bitcoin').value = '';
          ractive.find('#fiat').value = '';
        }
      })
    })
  }

  function setPreferredCurrency(currency, old){
    if (old === undefined) return; // when loading wallet

    emitter.emit('send-fiat-changed', currency)
    ractive.fire('bitcoin-to-fiat')
  }

  return ractive
}
