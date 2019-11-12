'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var moonpay = require('lib/moonpay');
var denomination = require('lib/denomination');
var getTokenNetwork = require('lib/token').getTokenNetwork;
var Big = require('big.js');
var _ = require('lodash');
var showAddCreditCard = require('widgets/modals/moonpay/add-credit-card');
var showTooltip = require('widgets/modals/tooltip');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
      isLoadingFiat: false,
      isLoadingCrypto: true,
      isFirstEstimate: true,
      dailyLimitRemaining: '',
      fiatSymbol: '',
      toSymbol: '',
      rate: '',
      cards: [],
      selectedCard: undefined,
    },
    partials: {
      loader: require('../loader.ract'),
    }
  });

  var toSymbol;
  var fiatSymbol;

  ractive.on('before-show', function(context) {
    ractive.set('isLoading', true);
    ractive.set('isLoadingCrypto', true);
    ractive.set('isFirstEstimate', true);
    ractive.set('dailyLimitRemaining', context.dailyLimitRemaining);

    fiatSymbol = context.fiatSymbol;
    toSymbol = denomination(getTokenNetwork());
    ractive.set('fiatSymbol', fiatSymbol);
    ractive.set('toSymbol', toSymbol);

    return moonpay.getCards().then(function(cards) {
      ractive.set('isLoading', false);
      ractive.set('cards', cards);
      cryptoEstimate();
    });
  });

  var _fiatAmount = '20';

  ractive.on('fiat-to-crypto', function() {
    var fiatAmount = ractive.find('#moonpay_purchase_fiat').value;
    if (fiatAmount === _fiatAmount) return;
    _fiatAmount = fiatAmount;
    ractive.set('isLoadingCrypto', true);
    debounceCryptoEstimate();
  });

  var debounceCryptoEstimate = _.debounce(cryptoEstimate, 500);

  function cryptoEstimate() {
    if (!ractive.el.classList.contains('current')) return;
    var fiatAmount = ractive.find('#moonpay_purchase_fiat').value;
    return new Promise(function(resolve, reject) {
      if (!fiatAmount) return reject(new Error('empty_fiat'));
      resolve();
    }).then(function() {
      return moonpay.quote(toSymbol.toLowerCase(), fiatSymbol.toLowerCase(), fiatAmount, true).then(function(quote) {
        ractive.set('isLoadingCrypto', false);
        ractive.set('isFirstEstimate', false);
        ractive.set('rate', Big(quote.totalAmount).div(quote.quoteCurrencyAmount).toFixed(2));
        _cryptoAmount = quote.quoteCurrencyAmount.toString();
        ractive.find('#moonpay_purchase_crypto').value = _cryptoAmount;
      });
    }).catch(function(err) {
      ractive.set('isLoadingCrypto', false);
      ractive.set('isFirstEstimate', false);
      ractive.set('rate', '0');
      _cryptoAmount = '0';
      ractive.find('#moonpay_purchase_crypto').value = _cryptoAmount;
      if (err && err.message !== 'empty_fiat') console.error(err);
    });
  }

  var _cryptoAmount;

  ractive.on('crypto-to-fiat', function() {
    var cryptoAmount = ractive.find('#moonpay_purchase_crypto').value;
    if (cryptoAmount === _cryptoAmount) return;
    _cryptoAmount = cryptoAmount;
    ractive.set('isLoadingFiat', true);
    debounceFiatEstimate();
  });

  var debounceFiatEstimate = _.debounce(fiatEstimate, 500);

  function fiatEstimate() {
    if (!ractive.el.classList.contains('current')) return;
    var cryptoAmount = ractive.find('#moonpay_purchase_crypto').value;
    return new Promise(function(resolve, reject) {
      if (!cryptoAmount) return reject(new Error('empty_crypto'));
      resolve();
    }).then(function() {
      return moonpay.rate(toSymbol.toLowerCase(), fiatSymbol.toLowerCase()).then(function(baseRate) {
        var baseFiatAmount = Big(cryptoAmount).times(baseRate).toFixed(2);
        return moonpay.quote(toSymbol.toLowerCase(), fiatSymbol.toLowerCase(), baseFiatAmount, false).then(function(quote) {
          ractive.set('isLoadingFiat', false);
          ractive.set('rate', Big(quote.totalAmount).div(cryptoAmount).toFixed(2));
          _fiatAmount = quote.totalAmount.toString();
          ractive.find('#moonpay_purchase_fiat').value = _fiatAmount;
        });
      });
    }).catch(function(err) {
      ractive.set('isLoadingFiat', false);
      ractive.set('rate', '0');
      _fiatAmount = '0';
      ractive.find('#moonpay_purchase_fiat').value = _fiatAmount;
      if (err && err.message !== 'empty_crypto') console.error(err);
    });
  }

  ractive.on('set-max-amount', function() {
    ractive.find('#moonpay_purchase_fiat').value = ractive.get('dailyLimitRemaining');
    ractive.fire('fiat-to-crypto');
  });

  ractive.on('back', function() {
    emitter.emit('change-moonpay-step', 'main');
  });

  ractive.on('focusAmountInput', function(context) {
    context.node.parentNode.style.zIndex = 5000;
  });

  ractive.on('blurAmountInput', function(context) {
    context.node.parentNode.style.zIndex = '';
  });

  ractive.on('help-rate', function() {
    showTooltip({
      message: 'If the rate changes by more than +/-&nbsp;2.5%% you will be asked to reconfirm the transaction via email.',
      isHTML: true
    });
  });

  ractive.on('add-credit-card', function() {
    showAddCreditCard({onSuccessDismiss: function() {
      return moonpay.getCards().then(function(cards) {
        ractive.set('cards', cards);
      });
    }});
  });

  ractive.on('buy', function() {
    console.log(ractive.get('selectedCard'));
  });

  return ractive;
}
