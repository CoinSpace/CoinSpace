import Ractive from 'lib/ractive';
import initMain from './main';
import initAccount from './account';
import initAbout from './about';
import initSecurityPin from './security/pin';
import initSecurityHardware from './security/hardware';
import details from 'lib/wallet/details';
import template from './index.ract';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
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
}
