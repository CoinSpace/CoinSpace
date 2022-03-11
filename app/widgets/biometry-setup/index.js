import Ractive from 'lib/ractive';
import { translate } from 'lib/i18n';
import biometry from 'lib/biometry';
import template from './index.ract';

function open(options) {
  const labels = getLabels();
  const {
    animation = true,
    icon = labels.icon,
    header = labels.header,
    description = labels.description,
    buttonLabel = labels.buttonLabel,
    append = false,
    pin,
  } = options;

  const ractive = new Ractive({
    el: document.getElementById('general-purpose-overlay'),
    append,
    template,
    data: {
      icon,
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
      await biometry.enable(pin);
    } catch (err) {
      if (err.message === 'biometry_error') return;
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

function getLabels() {
  const type = biometry.getType();
  if (!type) return {};
  const ENABLE = translate('Enable') + ' ';
  if (type === biometry.TYPES.BIOMETRICS) {
    return {
      header: translate('Biometrics'),
      description: translate('Use Biometrics in place of PIN.'),
      buttonLabel: ENABLE + translate('Biometrics'),
      icon: 'svg_fingerprint',
    };
  } else if (type === biometry.TYPES.FINGERPRINT) {
    return {
      header: translate('Fingerprint'),
      description: translate('Use Fingerprint in place of PIN.'),
      buttonLabel: ENABLE + translate('Fingerprint'),
      icon: 'svg_fingerprint',
    };
  } else if (type === biometry.TYPES.TOUCH_ID) {
    return {
      header: 'Touch ID',
      description: translate('Use Touch ID in place of PIN.'),
      buttonLabel: ENABLE + 'Touch ID',
      icon: 'svg_fingerprint',
    };
  } else if (type === biometry.TYPES.FACE_ID) {
    return {
      header: 'Face ID',
      description: translate('Use Face ID in place of PIN.'),
      buttonLabel: ENABLE + 'Face ID',
      icon: 'svg_faceid',
    };
  }
}

export default open;
