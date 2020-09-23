'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const initMain = require('./main');
const initAccount = require('./account');
const initAbout = require('./about');
const details = require('lib/wallet/details');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
  });

  const steps = {
    main: initMain(ractive.find('#widget-settings-main')),
    account: initAccount(ractive.find('#widget-settings-account')),
    about: initAbout(ractive.find('#widget-settings-about')),
  };
  let currentStep = steps.main;
  currentStep.show({ userInfo: details.get('userInfo') });

  ractive.on('before-hide', () => {
    ractive.set('isLoading', true);
    currentStep.hide();
  });

  emitter.on('change-widget-settings-step', (step, data) => {
    showStep(steps[step], data);
  });

  steps.main.on('back', () => {
    ractive.fire('back');
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
