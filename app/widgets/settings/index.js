'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const initMain = require('./main');
const initAccount = require('./account');
const initAbout = require('./about');
const initSecurityPin = require('./security/pin');
const details = require('lib/wallet/details');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
  });

  const steps = {
    main: initMain(ractive.find('#widget-settings-main')),
    account: initAccount(ractive.find('#widget-settings-account')),
    securityPin: initSecurityPin(ractive.find('#widget-settings-security-pin')),
    about: initAbout(ractive.find('#widget-settings-about')),
  };
  let currentStep = steps.main;
  currentStep.show({ userInfo: details.get('userInfo') });

  if (process.env.BUILD_PLATFORM === 'ios') window.StatusBar.styleDefault();

  emitter.on('change-widget-settings-step', (step, data) => {
    showStep(steps[step], data);
  });

  steps.main.on('back', () => {
    ractive.fire('back');
    if (process.env.BUILD_PLATFORM === 'ios') window.StatusBar.styleLightContent();
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
