'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var initAuth = require('./auth');
var initMain = require('./main');
var initVerification = require('./verification');
var initPaymentMethods = require('./payment-methods');
var initPurchase = require('./purchase');
var initHistory = require('./history');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    partials: {
      loader: require('./loader.ract')
    }
  });

  var steps = {
    auth: initAuth(ractive.find('#moonpay_auth')),
    main: initMain(ractive.find('#moonpay_main')),
    verification: initVerification(ractive.find('#moonpay_verification')),
    paymentMethods: initPaymentMethods(ractive.find('#moonpay_payment_methods')),
    purchase: initPurchase(ractive.find('#moonpay_purchase')),
    history: initHistory(ractive.find('#moonpay_history'))
  };
  var currentStep = steps.auth;

  ractive.on('before-show', function() {
    showStep(steps.auth);
  });

  ractive.on('before-hide', function() {
    ractive.set('isLoading', true);
    currentStep.hide();
  });

  emitter.on('change-moonpay-step', function(step, data) {
    showStep(steps[step], data);
  })

  function showStep(step, data) {
    setTimeout(function() {
      currentStep.hide();
      step.show(data);
      currentStep = step;
    });
  }

  return ractive;
}
