import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import LS from 'lib/wallet/localStorage';
import initChoose from './choose';
import initCreate from './create';
import initCreatePassphrase from './create-passphrase';
import initCreatePassphraseConfirm from './create-passphrase-confirm';
import security from 'lib/wallet/security';
import template from './index.ract';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
  });

  const steps = {
    choose: initChoose(ractive.find('#auth_choose')),
    create: initCreate(ractive.find('#auth_create')),
    createPassphrase: initCreatePassphrase(ractive.find('#auth_create_passphrase')),
    createPassphraseConfirm: initCreatePassphraseConfirm(ractive.find('#auth_create_passphrase_confirm')),
  };
  let currentStep = steps.choose;

  ractive.on('before-show', () => {
    if (LS.isRegistered()) {
      steps.choose.showPin();
    } else {
      showStep(steps.choose);
    }
  });

  ractive.on('before-hide', () => {
    currentStep.hide();
    security.lock();
    const { passphraseWidget, pinWidget } = currentStep;
    if (passphraseWidget && !passphraseWidget.torndown) passphraseWidget.close();
    if (pinWidget && !pinWidget.torndown) pinWidget.close();
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
}
