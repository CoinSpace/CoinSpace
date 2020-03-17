'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var moonpay = require('lib/moonpay');
var denomination = require('lib/denomination');
var getToken = require('lib/token').getToken;
var Big = require('big.js');
var _ = require('lodash');
var showAddCreditCard = require('widgets/modals/moonpay/add-credit-card');
var showTooltip = require('widgets/modals/tooltip');
var showError = require('widgets/modals/flash').showError;
var showConfirmPurchase = require('widgets/modals/moonpay/confirm-purchase');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
      isLoadingFiat: false,
      isLoadingCrypto: true,
      isFirstEstimate: true,
      fiatSymbol: '',
      cryptoSymbol: '',
      rate: '',
      fee: '',
      paymentMethods: [],
      selectedPaymentMethod: undefined,
      minAmount: 20,
      maxAmount: ''
    },
    partials: {
      loader: require('../loader.ract'),
    }
  });

  var fiat;
  var creditCardLimit = 0;
  var bankAccountLimit = 0;
  var cryptoSymbol;

  var _fiatAmount = 20 + '';
  var _cryptoAmount;

  ractive.on('before-show', function(context) {
    ractive.set('isLoading', true);
    ractive.set('isLoadingFiat', false);
    ractive.set('isLoadingCrypto', true);
    ractive.set('isFirstEstimate', true);
    ractive.set('fiatSymbol', '');
    ractive.set('cryptoSymbol', '');
    ractive.set('rate', '');
    ractive.set('fee', '');
    ractive.set('paymentMethods', []);
    ractive.set('selectedPaymentMethod', undefined);
    ractive.set('minAmount', context.fiat.minAmount);

    fiat = context.fiat;
    _fiatAmount = fiat.minAmount + '';

    creditCardLimit = context.creditCardLimit;
    bankAccountLimit = context.bankAccountLimit;

    cryptoSymbol = denomination(getToken());
    ractive.set('fiatSymbol', fiat.symbol);
    ractive.set('cryptoSymbol', cryptoSymbol);

    return Promise.all([
      moonpay.getCards(),
      moonpay.getBankAccounts(fiat.symbol)
    ]).then(function(results) {
      ractive.set('isLoading', false);
      ractive.set('paymentMethods', results[0].concat(results[1]));
      setMaxAmount();
      cryptoEstimate();
    });
  });

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
      return moonpay.quote(cryptoSymbol.toLowerCase(), fiat.symbol.toLowerCase(), fiatAmount, false).then(function(quote) {
        ractive.set('isLoadingCrypto', false);
        ractive.set('isFirstEstimate', false);
        ractive.set('rate', Big(quote.baseCurrencyAmount).div(quote.quoteCurrencyAmount).toFixed(fiat.precision));
        ractive.set('fee', Big(quote.feeAmount).plus(quote.extraFeeAmount).toFixed(fiat.precision));
        _cryptoAmount = quote.quoteCurrencyAmount.toString();
        ractive.find('#moonpay_purchase_crypto').value = _cryptoAmount;
      });
    }).catch(function(err) {
      ractive.set('isLoadingCrypto', false);
      ractive.set('isFirstEstimate', false);
      ractive.set('rate', '0');
      ractive.set('fee', '0');
      _cryptoAmount = '0';
      ractive.find('#moonpay_purchase_crypto').value = _cryptoAmount;
      if (err && err.message !== 'empty_fiat') console.error(err);
    });
  }

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
      return moonpay.rate(cryptoSymbol.toLowerCase(), fiat.symbol.toLowerCase()).then(function(baseRate) {
        var baseFiatAmount = Big(cryptoAmount).times(baseRate).toFixed(fiat.precision);
        return moonpay.quote(cryptoSymbol.toLowerCase(), fiat.symbol.toLowerCase(), baseFiatAmount, false).then(function(quote) {
          ractive.set('isLoadingFiat', false);
          ractive.set('rate', Big(quote.baseCurrencyAmount).div(quote.quoteCurrencyAmount).toFixed(fiat.precision));
          ractive.set('fee', Big(quote.feeAmount).plus(quote.extraFeeAmount).toFixed(fiat.precision));
          _fiatAmount = quote.baseCurrencyAmount.toString();
          ractive.find('#moonpay_purchase_fiat').value = _fiatAmount;
        });
      });
    }).catch(function(err) {
      ractive.set('isLoadingFiat', false);
      ractive.set('rate', '0');
      ractive.set('fee', '0');
      _fiatAmount = '0';
      ractive.find('#moonpay_purchase_fiat').value = _fiatAmount;
      if (err && err.message !== 'empty_crypto') console.error(err);
    });
  }

  ractive.on('set-max-amount', function() {
    ractive.find('#moonpay_purchase_fiat').value = ractive.get('maxAmount');
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
        ractive.set('paymentMethods', cards);
      });
    }});
  });

  function setMaxAmount() {
    var selectedPaymentMethod = ractive.get('selectedPaymentMethod');
    if (selectedPaymentMethod && selectedPaymentMethod.type === 'bankAccount') {
      ractive.set('maxAmount', bankAccountLimit);
    } else {
      ractive.set('maxAmount', creditCardLimit);
    }
  }
  ractive.on('change-payment-method', setMaxAmount);

  ractive.on('buy', function() {
    var paymentMethod = ractive.get('selectedPaymentMethod');
    if (!paymentMethod) return showError({message: 'Please select a payment method'});
    var fiatAmount = ractive.find('#moonpay_purchase_fiat').value;
    var minAmount = ractive.get('minAmount');
    if (fiatAmount < minAmount) return showError({message: 'Please enter an amount above', interpolations: {dust: minAmount + ' ' + fiat.symbol}});
    var cryptoAmount = ractive.find('#moonpay_purchase_crypto').value;
    var fee = ractive.get('fee');
    showConfirmPurchase({
      fiatAmount: Big(fiatAmount).plus(fee).toFixed(fiat.precision),
      fiatSymbol: fiat.symbol,
      cryptoAmount: cryptoAmount,
      cryptoSymbol: cryptoSymbol,
      paymentMethod: paymentMethod
    });
  });

  return ractive;
}
