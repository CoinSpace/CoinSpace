import Ractive from 'lib/ractive';
import { translate } from 'lib/i18n';
import os from 'lib/detect-os';
import touchId from 'lib/touch-id';
import template from './index.ract';

function open(options) {
  const {
    animation = true,
    header = getHeader(),
    description = getDescription(),
    buttonLabel = getButtonLabel(),
    append = false,
    pin,
  } = options;

  const ractive = new Ractive({
    el: document.getElementById('general-purpose-overlay'),
    append,
    template,
    data: {
      header,
      description,
      buttonLabel,
      animation,
      isOpen: false,
    },
    oncomplete() {
      setTimeout(() => this.set('isOpen', true), 1); // ios fix
    },
    onteardown() {
      this.set('isOpen', false);
    },
  });

  ractive.on('back', () => {
    ractive.close();
  });

  ractive.on('confirm', async () => {
    try {
      await touchId.enable(pin);
    } catch (err) {
      if (err.message === 'touch_id_error') return;
      return console.error(err);
    }
    ractive.close();
  });

  ractive.close = () => {
    ractive.fire('close');
    ractive.set('isOpen', false);
    setTimeout(() => {
      ractive.teardown();
    }, 300);
  };

  return ractive;
}

function getHeader() {
  if (os === 'ios' || os === 'macos') {
    return 'Touch ID';
  } else if (os === 'android') {
    return translate('Fingerprint');
  } else {
    return translate('Biometrics');
  }
}

function getDescription() {
  if (os === 'ios' || os === 'macos') {
    return translate('Use Touch ID in place of PIN.');
  } else if (os === 'android') {
    return translate('Use Fingerprint in place of PIN.');
  } else {
    return translate('Use Biometrics in place of PIN.');
  }
}

function getButtonLabel() {
  const message = translate('Enable') + ' ';
  if (os === 'ios' || os === 'macos') {
    return message + 'Touch ID';
  } else if (os === 'android') {
    return message + translate('Fingerprint');
  } else {
    return message + translate('Biometrics');
  }
}

export default open;
