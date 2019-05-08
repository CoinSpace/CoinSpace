'use strict';

var Ractive = require('lib/ractive');
var Big = require('big.js');
var emitter = require('lib/emitter');
var db = require('lib/db');
var getWallet = require('lib/wallet').getWallet;
var getTokenNetwork = require('lib/token').getTokenNetwork;
var showError = require('widgets/modals/flash').showError;
var showInfo = require('widgets/modals/flash').showInfo;
var showConfirmation = require('widgets/modals/confirm-send');
var showTooltip = require('widgets/modals/tooltip');
var validateSend = require('lib/wallet').validateSend;
var getDynamicFees = require('lib/wallet').getDynamicFees;
var getDestinationInfo = require('lib/wallet').getDestinationInfo;
var resolveTo = require('lib/openalias/xhr.js').resolveTo;
var qrcode = require('lib/qrcode');
var bchaddr = require('bchaddrjs');
var initEosSetup = require('widgets/eos/setup');

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
      isRipple: false,
      isStellar: false,
      isEOS: false,
      validating: false,
      gasLimit: '',
    }
  })

  initEosSetup(ractive.find('#eos-setup'));

  emitter.on('prefill-wallet', function(address, context) {
    if (context !== 'send') return;
    ractive.set('to', address)
  })

  emitter.on('prefill-value', function(value, context) {
    if (context !== 'send') return;
    ractive.find('#bitcoin').value = value;
    ractive.fire('bitcoin-to-fiat')
  })

  emitter.on('prefill-destination-tag', function(tag, context) {
    if (context !== 'send') return;
    var $tag = ractive.find('#destination-tag');
    if ($tag) {
      $tag.value = tag;
    }
  })

  ractive.on('before-show', function() {
    var network = getTokenNetwork();
    ractive.set('isEthereum', network === 'ethereum');
    ractive.set('isRipple', network === 'ripple');
    ractive.set('isStellar', network === 'stellar');
    ractive.set('isEOS', network === 'eos');
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
    var to = ractive.get('to');

    Promise.all([
      resolveTo(to),
      getDynamicFees(),
      getDestinationInfo(to)
    ]).then(function(results) {

      var data = results[0];
      fixBitcoinCashAddress(data);

      var dynamicFees = results[1];
      var destinationInfo = results[2];

      var wallet = getWallet();

      var options = {
        wallet: wallet,
        to: data.to,
        alias: data.alias,
        dynamicFees: dynamicFees,
        destinationInfo: destinationInfo,
        amount: ractive.find('#bitcoin').value,
        denomination: ractive.get('denomination'),
        onSuccessDismiss: function() {
          ractive.set({to: ''});
          ractive.find('#bitcoin').value = '';
          ractive.find('#fiat').value = '';
          if (wallet.networkName === 'ripple') {
            ractive.find('#destination-tag').value = '';
            ractive.find('#invoice-id').value = '';
          } else if (wallet.networkName === 'stellar' || wallet.networkName === 'eos') {
            ractive.find('#memo').value = '';
          }
        }
      }

      if (wallet.networkName === 'ethereum') {
        wallet.gasLimit = ractive.find('#gas-limit').value;
      } else if (wallet.networkName === 'ripple') {
        options.tag = ractive.find('#destination-tag').value;
        options.invoiceId = ractive.find('#invoice-id').value;
        options.amount = Big(options.amount || '0').toFixed(6).replace(/0+$/, '').replace(/\.+$/, '');
      } else if (wallet.networkName === 'stellar') {
        options.amount = Big(options.amount || '0').toFixed(7).replace(/0+$/, '').replace(/\.+$/, '');
        options.memo = ractive.find('#memo').value;
      } else if (wallet.networkName === 'eos') {
        options.amount = Big(options.amount || '0').toFixed(4).replace(/0+$/, '').replace(/\.+$/, '');
        options.memo = ractive.find('#memo').value;
      }

      validateAndShowConfirm(options);
    }).catch(function(e) {
      ractive.set('validating', false);
      if (/is not a valid address/.test(e.message)) {
        return showError({title: 'Uh Oh...', message: 'Please enter a valid address to send to'})
      }
    })
  })

  emitter.on('wallet-ready', function() {
    var wallet = getWallet();
    ractive.set('needToSetupEos', wallet.networkName === 'eos' && !wallet.isActive);
    ractive.set('denomination', wallet.denomination);
    ractive.set('gasLimit', wallet.gasLimit);
  });

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

  ractive.on('fiat-to-bitcoin', function(context) {
    var fiat = ractive.find('#fiat').value;
    if (!fiat || context.event.code === 'Tab') return;

    var exchangeRate = ractive.get('exchangeRates')[ractive.get('selectedFiat')];
    var bitcoin = '0';
    if (exchangeRate) {
      bitcoin = Big(fiat).div(exchangeRate).toFixed(8)
    }
    ractive.find('#bitcoin').value = bitcoin;
  })

  ractive.on('bitcoin-to-fiat', function() {
    var bitcoin = ractive.find('#bitcoin').value;
    if (!bitcoin) return;

    var exchangeRate = ractive.get('exchangeRates')[ractive.get('selectedFiat')];
    if (typeof exchangeRate !== 'number') return;

    var fiat = Big(bitcoin).times(exchangeRate).toFixed(2);
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

  ractive.on('help-destination-tag', function() {
    showTooltip({
      message: 'An arbitrary unsigned 32-bit integer that identifies a reason for payment or a non-Ripple account.'
    })
  })

  ractive.on('help-invoice-id', function() {
    showTooltip({
      message: 'A 256-bit hash that can be used to identify a particular payment.'
    })
  })

  ractive.on('help-memo', function() {
    var wallet = getWallet();
    var message = '';
    if (wallet.networkName === 'stellar') {
      message = 'The memo contains optional extra information. A string up to 28-bytes long.';
    } else if (wallet.networkName === 'eos') {
      message = 'The memo contains optional extra information. A string up to 256-bytes long.';
    }
    showTooltip({message: message});
  })

  function validateAndShowConfirm(options) {
    try {
      validateSend(options);
      ractive.set('validating', false);
      showConfirmation(options);
    } catch (err) {
      ractive.set('validating', false);
      var interpolations = err.interpolations
      if (/trying to empty your wallet/.test(err.message)) {
        ractive.find('#bitcoin').value = interpolations.sendableBalance;
        ractive.fire('bitcoin-to-fiat');
        return showInfo({message: err.message, interpolations: interpolations})
      }
      return showError({title: 'Uh Oh...', message: err.message, href: err.href, linkText: err.linkText, interpolations: interpolations})
    }
  }

  function setPreferredCurrency(currency, old){
    if (old === undefined) return; // when loading wallet

    emitter.emit('send-fiat-changed', currency)
    ractive.fire('bitcoin-to-fiat')
  }

  function fixBitcoinCashAddress(data) {
    if (getTokenNetwork() !== 'bitcoincash') return;
    try {
      var legacy = bchaddr.toLegacyAddress(data.to);
      if (legacy !== data.to) {
        data.alias = data.to;
        data.to = legacy;
      }
    } catch (e) {}
  }

  return ractive
}
