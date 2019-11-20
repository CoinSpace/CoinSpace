'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var moonpay = require('lib/moonpay');
var showIdentityVerification = require('widgets/modals/moonpay/identity-verification');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
      dailyLimitRemaining: 0,
      monthlyLimitRemaining: 0,
      limitIncreaseEligible: false,
      currencies: [],
      defaultCurrency: '',
      defaultCurrencyLabel: function() {
        return moonpay.getFiatById(ractive.get('defaultCurrency'), 'symbol');
      },
    },
    partials: {
      loader: require('../loader.ract'),
    }
  });

  var verificationLevels = [];
  var limit;

  ractive.on('before-show', function() {
    ractive.set('isLoading', true);
    ractive.set('dailyLimitRemaining', 0);
    ractive.set('monthlyLimitRemaining', 0);
    ractive.set('limitIncreaseEligible', false);
    ractive.set('currencies', []);
    ractive.set('defaultCurrency', '');
    return Promise.all([
      moonpay.limits(),
      moonpay.loadFiat()
    ]).then(function(results) {
      ractive.set('isLoading', false);
      var customer = moonpay.getCustomer();
      limit = results[0].limits.find(function(item) {
        return item.type === 'buy_credit_debit_card';
      });
      var fiatSign = moonpay.getFiatById(customer.defaultCurrencyId, 'sign');
      ractive.set('dailyLimitRemaining', fiatSign + limit.dailyLimitRemaining);
      ractive.set('monthlyLimitRemaining', fiatSign + limit.monthlyLimitRemaining);
      ractive.set('limitIncreaseEligible', results[0].limitIncreaseEligible);
      ractive.set('currencies', moonpay.getFiatList());
      ractive.set('defaultCurrency', customer.defaultCurrencyId);
      verificationLevels = results[0].verificationLevels;
    }).catch(function(err) {
      ractive.set('isLoading', false);
      console.error(err);
    });
  });

  ractive.on('change-currency', function() {
    var id = ractive.get('defaultCurrency');
    ractive.set('isLoading', true);
    return moonpay.updateCustomer({defaultCurrencyId: id}).then(function() {
      moonpay.getCustomer().defaultCurrencyId = id;
      ractive.show();
    }).catch(function(err) {
      console.error(err);
      ractive.set('isLoading', false);
      ractive.set('defaultCurrency', moonpay.getCustomer().defaultCurrencyId);
    });
  });

  ractive.on('back', function() {
    emitter.emit('set-exchange', 'none');
  });

  ractive.on('verification', function() {
    emitter.emit('change-moonpay-step', 'verification', {
      verificationLevels: verificationLevels
    });
  });

  ractive.on('payment-methods', function() {
    if (!moonpay.getCustomer().firstName) {
      return showIdentityVerification(ractive.show.bind(ractive));
    }
    emitter.emit('change-moonpay-step', 'paymentMethods');
  });

  ractive.on('history', function() {
    emitter.emit('change-moonpay-step', 'history');
  });

  ractive.on('buy', function() {
    if (!moonpay.getCustomer().firstName) {
      return showIdentityVerification(ractive.show.bind(ractive));
    }
    var fiatSymbol = moonpay.getFiatById(moonpay.getCustomer().defaultCurrencyId, 'symbol');
    emitter.emit('change-moonpay-step', 'purchase', {
      dailyLimitRemaining: limit.dailyLimitRemaining,
      fiatSymbol: fiatSymbol
    });
  });

  ractive.on('logout', function() {
    moonpay.cleanAccessToken();
    moonpay.cleanCustomer();
    emitter.emit('set-exchange', 'none');
  });

  ractive.on('buy', function() {

  });

  return ractive;
}
