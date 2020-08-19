'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const initAuth = require('./auth');
const initMain = require('./main');
const initVerification = require('./verification');
const initPaymentMethods = require('./payment-methods');
const initPurchase = require('./purchase');
const initHistory = require('./history');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    partials: {
      loader: require('./loader.ract'),
    },
  });

  const steps = {
    auth: initAuth(ractive.find('#moonpay_auth')),
    main: initMain(ractive.find('#moonpay_main')),
    verification: initVerification(ractive.find('#moonpay_verification')),
    paymentMethods: initPaymentMethods(ractive.find('#moonpay_payment_methods')),
    purchase: initPurchase(ractive.find('#moonpay_purchase')),
    history: initHistory(ractive.find('#moonpay_history')),
  };
  let currentStep = steps.auth;

  ractive.on('before-show', () => {
    showStep(steps.auth);
  });

  ractive.on('before-hide', () => {
    ractive.set('isLoading', true);
    currentStep.hide();
  });

  emitter.on('change-moonpay-step', (step, data) => {
    showStep(steps[step], data);
  });

  function showStep(step, data) {
    setTimeout(() => {
      currentStep.hide();
      step.show(data);
      currentStep = step;
    });
  }

  return ractive;
};
