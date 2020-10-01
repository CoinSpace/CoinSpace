'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const moonpay = require('lib/moonpay');
const CS = require('lib/wallet');
const Big = require('big.js');
const _ = require('lodash');
const showAddCreditCard = require('widgets/modals/moonpay/add-credit-card');
const showTooltip = require('widgets/modals/tooltip');
const { showError } = require('widgets/modals/flash');
const showConfirmPurchase = require('widgets/modals/moonpay/confirm-purchase');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
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
      maxAmount: '',
    },
    partials: {
      loader: require('../loader.ract'),
    },
  });

  let fiat;
  let creditCardLimit = 0;
  let bankAccountLimit = 0;
  let cryptoSymbol;

  let _fiatAmount = 20 + '';
  let _cryptoAmount;

  ractive.on('before-show', (context) => {
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

    // eslint-disable-next-line prefer-destructuring
    fiat = context.fiat;
    _fiatAmount = fiat.minAmount + '';

    creditCardLimit = Math.min(context.creditCardLimit, fiat.maxAmount);
    bankAccountLimit = Math.min(context.bankAccountLimit, fiat.maxAmount);

    cryptoSymbol = CS.getWallet().denomination;
    ractive.set('fiatSymbol', fiat.symbol);
    ractive.set('cryptoSymbol', cryptoSymbol);

    return Promise.all([
      moonpay.getCards(),
      moonpay.getBankAccounts(fiat.symbol),
    ]).then((results) => {
      ractive.set('isLoading', false);
      ractive.set('paymentMethods', results[0].concat(results[1]));
      setMaxAmount();
      cryptoEstimate();
    });
  });

  ractive.on('fiat-to-crypto', () => {
    const fiatAmount = ractive.find('#moonpay_purchase_fiat').value;
    if (fiatAmount === _fiatAmount) return;
    _fiatAmount = fiatAmount;
    ractive.set('isLoadingCrypto', true);
    debounceCryptoEstimate();
  });

  const debounceCryptoEstimate = _.debounce(cryptoEstimate, 500);

  function cryptoEstimate() {
    if (!ractive.el.classList.contains('current')) return;
    const fiatAmount = ractive.find('#moonpay_purchase_fiat').value;
    const minAmount = ractive.get('minAmount');
    return new Promise((resolve, reject) => {
      if (!fiatAmount) return reject(new Error('invalid_amount'));
      if (fiatAmount < minAmount) return reject(new Error('invalid_amount'));
      resolve();
    }).then(() => {
      const paymentMethod = ractive.get('selectedPaymentMethod');
      return moonpay.quote(cryptoSymbol.toLowerCase(), fiat.symbol.toLowerCase(), fiatAmount, paymentMethod, false)
        .then((quote) => {
          ractive.set('isLoadingCrypto', false);
          ractive.set('isFirstEstimate', false);
          ractive.set('rate', Big(quote.baseCurrencyAmount).div(quote.quoteCurrencyAmount).toFixed(fiat.precision));
          ractive.set('fee', Big(quote.feeAmount).plus(quote.extraFeeAmount).toFixed(fiat.precision));
          _cryptoAmount = quote.quoteCurrencyAmount.toString();
          ractive.find('#moonpay_purchase_crypto').value = _cryptoAmount;
        });
    }).catch((err) => {
      ractive.set('isLoadingCrypto', false);
      ractive.set('isFirstEstimate', false);
      ractive.set('rate', '0');
      ractive.set('fee', '0');
      _cryptoAmount = '0';
      ractive.find('#moonpay_purchase_crypto').value = _cryptoAmount;
      if (err && err.message !== 'invalid_amount') console.error(err);
    });
  }

  ractive.on('crypto-to-fiat', () => {
    const cryptoAmount = ractive.find('#moonpay_purchase_crypto').value;
    if (cryptoAmount === _cryptoAmount) return;
    _cryptoAmount = cryptoAmount;
    ractive.set('isLoadingFiat', true);
    debounceFiatEstimate();
  });

  const debounceFiatEstimate = _.debounce(fiatEstimate, 500);

  function fiatEstimate() {
    if (!ractive.el.classList.contains('current')) return;
    const cryptoAmount = ractive.find('#moonpay_purchase_crypto').value;
    return new Promise((resolve, reject) => {
      if (!cryptoAmount) return reject(new Error('invalid_amount'));
      resolve();
    }).then(() => {
      return moonpay.rate(cryptoSymbol.toLowerCase(), fiat.symbol.toLowerCase()).then((baseRate) => {
        const baseFiatAmount = Big(cryptoAmount).times(baseRate).toFixed(fiat.precision);
        const minAmount = ractive.get('minAmount');
        return new Promise((resolve, reject) => {
          if (!baseFiatAmount) return reject(new Error('invalid_amount'));
          if (baseFiatAmount < minAmount) return reject(new Error('invalid_amount'));
          resolve(baseFiatAmount);
        });
      }).then((baseFiatAmount) => {
        const paymentMethod = ractive.get('selectedPaymentMethod');
        // eslint-disable-next-line max-len
        return moonpay.quote(cryptoSymbol.toLowerCase(), fiat.symbol.toLowerCase(), baseFiatAmount, paymentMethod, false)
          .then((quote) => {
            ractive.set('isLoadingFiat', false);
            ractive.set('rate', Big(quote.baseCurrencyAmount).div(quote.quoteCurrencyAmount).toFixed(fiat.precision));
            ractive.set('fee', Big(quote.feeAmount).plus(quote.extraFeeAmount).toFixed(fiat.precision));
            _fiatAmount = quote.baseCurrencyAmount.toString();
            ractive.find('#moonpay_purchase_fiat').value = _fiatAmount;
          });
      });
    }).catch((err) => {
      ractive.set('isLoadingFiat', false);
      ractive.set('rate', '0');
      ractive.set('fee', '0');
      _fiatAmount = '0';
      ractive.find('#moonpay_purchase_fiat').value = _fiatAmount;
      if (err && err.message !== 'invalid_amount') console.error(err);
    });
  }

  ractive.on('set-max-amount', () => {
    ractive.find('#moonpay_purchase_fiat').value = ractive.get('maxAmount');
    ractive.fire('fiat-to-crypto');
  });

  ractive.on('back', () => {
    emitter.emit('change-moonpay-step', 'main');
  });

  ractive.on('focusAmountInput', (context) => {
    context.node.parentNode.style.zIndex = 5000;
  });

  ractive.on('blurAmountInput', (context) => {
    context.node.parentNode.style.zIndex = '';
  });

  ractive.on('help-rate', () => {
    showTooltip({
      // eslint-disable-next-line max-len
      message: 'If the rate changes by more than +/-&nbsp;2.5%% you will be asked to reconfirm the transaction via email.',
      isHTML: true,
    });
  });

  ractive.on('add-credit-card', () => {
    showAddCreditCard({ onSuccessDismiss() {
      return moonpay.getCards().then((cards) => {
        ractive.set('paymentMethods', cards);
      });
    } });
  });

  function setMaxAmount() {
    const selectedPaymentMethod = ractive.get('selectedPaymentMethod');
    if (selectedPaymentMethod && selectedPaymentMethod.type === 'bankAccount') {
      ractive.set('maxAmount', bankAccountLimit);
    } else {
      ractive.set('maxAmount', creditCardLimit);
    }
  }
  ractive.on('change-payment-method', () => {
    setMaxAmount();
    _fiatAmount = '0';
    ractive.fire('fiat-to-crypto');
  });

  ractive.on('buy', () => {
    const paymentMethod = ractive.get('selectedPaymentMethod');
    if (!paymentMethod) return showError({ message: 'Please select a payment method' });
    const fiatAmount = ractive.find('#moonpay_purchase_fiat').value;
    const minAmount = ractive.get('minAmount');
    if (fiatAmount < minAmount) {
      return showError({
        message: 'Please enter an amount above',
        interpolations: { dust: minAmount + ' ' + fiat.symbol },
      });
    }
    const cryptoAmount = ractive.find('#moonpay_purchase_crypto').value;
    const fee = ractive.get('fee');
    showConfirmPurchase({
      fiatAmount: Big(fiatAmount).plus(fee).toFixed(fiat.precision),
      fiatSymbol: fiat.symbol,
      cryptoAmount,
      cryptoSymbol,
      paymentMethod,
    });
  });

  return ractive;
};
