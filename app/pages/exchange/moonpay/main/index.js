'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const moonpay = require('lib/moonpay');
const showIdentityVerification = require('widgets/modals/moonpay/identity-verification');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
      creditCardLimit: {},
      bankAccountLimit: false,
      limitIncreaseEligible: false,
      currencies: [],
      defaultCurrency: '',
      defaultCurrencyLabel() {
        return moonpay.getFiatById(ractive.get('defaultCurrency'), 'symbol');
      },
      getDailyLimitLabel(limit) {
        const symbol = moonpay.getFiatById(ractive.get('defaultCurrency'), 'symbol');
        return limit.dailyLimitRemaining + ' / ' + limit.dailyLimit + ' ' + symbol;
      },
      getMonthlyLimitLabel(limit) {
        const symbol = moonpay.getFiatById(ractive.get('defaultCurrency'), 'symbol');
        return limit.monthlyLimitRemaining + ' / ' + limit.monthlyLimit + ' ' + symbol;
      },
    },
    partials: {
      loader: require('../loader.ract'),
    },
  });

  let verificationLevels = [];

  ractive.on('before-show', () => {
    ractive.set('isLoading', true);
    ractive.set('creditCardLimit', {});
    ractive.set('bankAccountLimit', false);
    ractive.set('limitIncreaseEligible', false);
    ractive.set('currencies', []);
    ractive.set('defaultCurrency', '');
    return Promise.all([
      moonpay.limits(),
      moonpay.loadFiat(),
    ]).then((results) => {
      ractive.set('isLoading', false);
      const customer = moonpay.getCustomer();
      const fiatSymbol = moonpay.getFiatById(customer.defaultCurrencyId, 'symbol');

      ractive.set('creditCardLimit', results[0].limits.find((item) => {
        return item.type === 'buy_credit_debit_card';
      }));
      ractive.set('bankAccountLimit', results[0].limits.find((item) => {
        if (fiatSymbol === 'GBP') {
          return item.type === 'buy_gbp_bank_transfer';
        } else if (fiatSymbol === 'EUR') {
          return item.type === 'buy_sepa_bank_transfer';
        }
        return false;
      }));
      ractive.set('limitIncreaseEligible', results[0].limitIncreaseEligible);
      ractive.set('currencies', moonpay.getFiatList());
      ractive.set('defaultCurrency', customer.defaultCurrencyId);
      // eslint-disable-next-line prefer-destructuring
      verificationLevels = results[0].verificationLevels;
    }).catch((err) => {
      ractive.set('isLoading', false);
      console.error(err);
    });
  });

  ractive.on('change-currency', () => {
    const id = ractive.get('defaultCurrency');
    ractive.set('isLoading', true);
    return moonpay.updateCustomer({ defaultCurrencyId: id }).then(() => {
      moonpay.getCustomer().defaultCurrencyId = id;
      ractive.show();
    }).catch((err) => {
      console.error(err);
      ractive.set('isLoading', false);
      ractive.set('defaultCurrency', moonpay.getCustomer().defaultCurrencyId);
    });
  });

  ractive.on('back', () => {
    emitter.emit('set-exchange', 'none');
  });

  ractive.on('verification', () => {
    emitter.emit('change-moonpay-step', 'verification', {
      verificationLevels,
    });
  });

  ractive.on('payment-methods', () => {
    if (!moonpay.getCustomer().firstName) {
      return showIdentityVerification(ractive.show.bind(ractive));
    }
    emitter.emit('change-moonpay-step', 'paymentMethods');
  });

  ractive.on('history', () => {
    emitter.emit('change-moonpay-step', 'history');
  });

  ractive.on('buy', () => {
    if (!moonpay.getCustomer().firstName) {
      return showIdentityVerification(ractive.show.bind(ractive));
    }
    const fiat = moonpay.getFiatById(moonpay.getCustomer().defaultCurrencyId);
    emitter.emit('change-moonpay-step', 'purchase', {
      creditCardLimit: ractive.get('creditCardLimit.dailyLimitRemaining'),
      bankAccountLimit: ractive.get('bankAccountLimit.dailyLimitRemaining'),
      fiat,
    });
  });

  ractive.on('logout', () => {
    moonpay.cleanAccessToken();
    moonpay.cleanCustomer();
    emitter.emit('set-exchange', 'none');
  });

  ractive.on('buy', () => {

  });

  return ractive;
};
