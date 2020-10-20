'use strict';

const Ractive = require('lib/ractive');
const initMain = require('./main');
const initAccount = require('./account');
const initAbout = require('./about');
const initSecurityPin = require('./security/pin');
const initSecurityHardware = require('./security/hardware');
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
    securityHardware: initSecurityHardware(ractive.find('#widget-settings-security-hardware')),
    about: initAbout(ractive.find('#widget-settings-about')),
  };
  let currentStep = steps.main;
  currentStep.show({ userInfo: details.get('userInfo') });

  Object.keys(steps).forEach((key) => {
    steps[key].on('change-step', (context) => {
      showStep(steps[context.step], context);
    });
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
