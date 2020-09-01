'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const initChoose = require('./choose');
const initCreate = require('./create');
const initCreatePassphrase = require('./create-passphrase');
const initCreatePassphraseConfirm = require('./create-passphrase-confirm');

module.exports = function(el) {
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
    showStep(steps.choose);
  });

  ractive.on('before-hide', () => {
    currentStep.hide();
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
