import Ractive from 'lib/ractive';
import { translate } from 'lib/i18n';
import { showError } from 'widgets/modals/flash';
import template from './index.ract';

function open(options, callback) {
  const {
    animation = true,
    header = translate('Enter Passphrase'),
  } = options;

  let statusBarStyle;
  if (process.env.BUILD_PLATFORM === 'ios') {
    statusBarStyle = window.StatusBar.style;
    window.StatusBar.setStyle('default');
  }

  const ractive = new Ractive({
    el: document.getElementById('general-purpose-overlay'),
    template,
    data: {
      header,
      animation,
      isLoading: false,
      isOpen: false,
      passphrase: '',
      count() {
        const passphrase = this.get('passphrase').trim();
        return passphrase ? passphrase.split(' ').length : 0;
      },
    },
    oncomplete() {
      setTimeout(() => this.set('isOpen', true), 1); // ios fix
    },
    onteardown() {
      this.set('isOpen', false);
    },
  });

  ractive.on('back', () => {
    if (ractive.get('isLoading')) return;
    ractive.close();
  });

  ractive.on('clear-passphrase', () => {
    if (ractive.get('isLoading')) return;
    const $passphrase = ractive.find('.js-passphrase-input');
    ractive.set('passphrase', '');
    $passphrase.focus();
  });

  ractive.on('confirm', () => {
    const passphrase = ractive.get('passphrase').toLowerCase().trim();
    if (!passphrase) return;
    ractive.set('isLoading', true);
    callback(passphrase);
  });

  ractive.wrong = () => {
    ractive.set('isLoading', false);
    showError({ message: 'Invalid passphrase' });
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

  return ractive;
}
export default open;
