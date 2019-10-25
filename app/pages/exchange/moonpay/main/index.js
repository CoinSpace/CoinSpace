'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var moonpay = require('lib/moonpay');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
      isLoadingBuy: false,
      dailyLimitRemaining: 0,
      monthlyLimitRemaining: 0,
      limitIncreaseEligible: false,
      defaultCurrency: ''
    },
    partials: {
      loader: require('../loader.ract'),
    }
  });

  var verificationLevels = [];

  ractive.on('before-show', function(context) {
    ractive.set('isLoading', true);
    return Promise.all([
      moonpay.limits(),
      moonpay.loadFiat()
    ]).then(function(results) {
      ractive.set('isLoading', false);
      var limit = results[0].limits.find(function(item) {
        return item.type === 'buy_credit_debit_card';
      });
      var fiatSign = moonpay.getFiatById(moonpay.getCustomer().defaultCurrencyId, 'sign');
      ractive.set('dailyLimitRemaining', fiatSign + limit.dailyLimitRemaining);
      ractive.set('monthlyLimitRemaining', fiatSign + limit.monthlyLimitRemaining);
      ractive.set('limitIncreaseEligible', results[0].limitIncreaseEligible);
      ractive.set('defaultCurrency', moonpay.getFiatById(moonpay.getCustomer().defaultCurrencyId, 'symbol'))
      verificationLevels = results[0].verificationLevels;
    }).catch(function(err) {
      ractive.set('isLoading', false);
      console.error(err);
    });
  });

  ractive.on('back', function() {
    emitter.emit('set-exchange', 'none');
  });

  ractive.on('buy', function() {
    
  });

  return ractive;
}
