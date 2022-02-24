import Ractive from 'lib/ractive';
import { translate } from 'lib/i18n';
import { isEnabled } from 'lib/touch-id';
import template from './index.ract';
import { isSafari } from 'lib/detect-os';

function open(options) {
  const {
    header = translate('Enter your PIN'),
    headerLoading = translate('Verifying PIN'),
    backLabel = translate('Back'),
    onPin = () => {},
    onTouchId = () => {},
    touchId,
    append = false,
  } = options;

  let statusBarStyle;
  if (process.env.BUILD_PLATFORM === 'ios') {
    statusBarStyle = window.StatusBar.style;
    window.StatusBar.setStyle('default');
  }

  const ractive = new Ractive({
    el: document.getElementById('general-purpose-overlay'),
    append,
    template,
    data: {
      header,
      backLabel,
      isLoading: false,
      isWrong: false,
      isOpen: false,
      description: '',
      pin: '',
      touchId: touchId && isEnabled(),
      enter,
    },
    oncomplete() {
      ractive.find('.widget-pin').focus();
      setTimeout(() => this.set('isOpen', true), 1); // ios fix
    },
    onteardown() {
      this.set('isOpen', false);
    },
  });

  ractive.on('keyboard', (context) => {
    const which = context.original.which || context.original.keyCode;
    const number = which - 48;
    enter(number);
  });

  ractive.observe('pin', (pin) => {
    pin = pin.trim();
    if (pin.length === 4) {
      setTimeout(() => {
        ractive.set('isLoading', true);
        ractive.set('header', headerLoading);
        onPin.bind(ractive)(pin);
      }, 300);
    }
  });

  ractive.on('backspace', () => {
    if (ractive.get('isLoading')) return;
    const pin = ractive.get('pin').trim();
    if (pin.length === 0 || pin.length === 4) return;
    ractive.set('pin', pin.substr(0, pin.length - 1));
  });

  ractive.on('touch-id', async () => {
    if (!isEnabled()) return;
    if (ractive.get('isLoading')) return;
    return onTouchId.bind(ractive)();
  });

  ractive.on('back', () => {
    if (ractive.get('isLoading')) return;
    ractive.close();
  });

  async function autoRunTouchId() {
    if (!touchId) return;
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (process.env.BUILD_TYPE === 'web') {
      if (!isSafari) {
        ractive.fire('touch-id');
      }
    } else {
      ractive.fire('touch-id');
    }
  }

  autoRunTouchId();

  ractive.wrong = (error) => {
    ractive.set('isLoading', false);
    ractive.set('isWrong', true);
    ractive.set('header', header);
    ractive.set('description', error && translate(error));
    ractive.set('pin', '');
    setTimeout(() => {
      ractive.set('isWrong', false);
    }, 700);
  };

  ractive.reset = () => {
    ractive.set('isLoading', false);
    ractive.set('isWrong', false);
    ractive.set('header', header);
    ractive.set('description', '');
    ractive.set('pin', '');
  };

  ractive.loading = () => {
    ractive.set('isLoading', true);
  };

  ractive.close = () => {
    ractive.set('isOpen', false);
    if (process.env.BUILD_PLATFORM === 'ios') {
      window.StatusBar.setStyle(statusBarStyle);
    }
    setTimeout(() => {
      ractive.teardown();
    }, 300);
  };

  function enter(number) {
    if (ractive.get('isLoading')) return;
    const pin = ractive.get('pin');
    if (pin.length === 4) return;
    ractive.set('pin', pin + number);
  }

  return ractive;
}

export default open;
