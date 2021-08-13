import Ractive from 'lib/ractive';
import { translate } from 'lib/i18n';
import { showError } from 'widgets/modals/flash';
import template from './index.ract';
const DEFAULT_WORDLIST = require('@coinspace/b39/wordlists/en.json');

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
  let passphraseOld = '';

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
      suggestions() {
        const passphrase = this.get('passphrase').toLowerCase();
        const passphraseDelta = Math.abs(passphrase.length - passphraseOld.length);
        passphraseOld = passphrase;
        if (passphraseDelta > 1) return [];
        const lastWord = passphrase.split(' ').slice(-1)[0];
        if (!lastWord) return [];
        const suggestions = DEFAULT_WORDLIST.filter((word) => word.startsWith(lastWord)).slice(0, 3);
        return suggestions;
      },
      acceptSuggestion(suggestion) {
        const words = this.get('passphrase').toLowerCase().trim().split(' ');
        words[words.length - 1] = `${suggestion} `;
        this.set('passphrase', words.join(' '));
        const $passphrase = ractive.find('.js-passphrase-input');
        $passphrase.focus();
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
    showError({ message: translate('Invalid passphrase') });
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
