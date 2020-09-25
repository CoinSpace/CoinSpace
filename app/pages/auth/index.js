'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const initChoose = require('./choose');
const initCreate = require('./create');
const initCreatePassphrase = require('./create-passphrase');
const initCreatePassphraseConfirm = require('./create-passphrase-confirm');
const { translate } = require('lib/i18n');

module.exports = function(el, options) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
  });

  const steps = {
    choose: initChoose(ractive.find('#auth_choose')),
    create: initCreate(ractive.find('#auth_create')),
    createPassphrase: initCreatePassphrase(ractive.find('#auth_create_passphrase')),
    createPassphraseConfirm: initCreatePassphraseConfirm(ractive.find('#auth_create_passphrase_confirm')),
  };
  let currentStep = steps.choose;

  ractive.on('before-show', () => {
    if (options.userExists) {
      steps.choose.showPin();
    } else {
      showStep(steps.choose);
    }
  });

  ractive.on('before-hide', () => {
    currentStep.hide();
    const { passphraseWidget, pinWidget } = currentStep;
    if (passphraseWidget && !passphraseWidget.torndown) passphraseWidget.close();
    if (pinWidget && !pinWidget.torndown) pinWidget.close();
    if (process.env.BUILD_PLATFORM === 'ios') window.StatusBar.styleLightContent();
  });

  emitter.on('change-auth-step', (step, data) => {
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
