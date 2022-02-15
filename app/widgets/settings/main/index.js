import Ractive from 'lib/ractive';
import LS from 'lib/wallet/localStorage';
import Avatar from 'lib/avatar';
import CS from 'lib/wallet';
import details from 'lib/wallet/details';
import importPrivateKey from 'widgets/modals/import-private-key';
import exportPrivateKeys from 'widgets/modals/export-private-keys';
import showEosSetupAccount from 'widgets/modals/eos-setup-account';
import derivationPath from 'widgets/modals/derivation-path';
import { translate } from 'lib/i18n';
import os from 'lib/detect-os';
import touchId from 'lib/touch-id';
import emitter from 'lib/emitter';
import template from './index.ract';
import i18n from 'lib/i18n';

// sorted by localeCompare
const languages = [
  { value: 'id', name: 'Bahasa Indonesia' },
  { value: 'bs', name: 'Bosanski' },
  { value: 'cs', name: 'Čeština' },
  { value: 'de', name: 'Deutsch' },
  { value: 'en', name: 'English' },
  { value: 'es', name: 'Español' },
  { value: 'fr', name: 'Français' },
  { value: 'hr', name: 'Hrvatski' },
  { value: 'it', name: 'Italiano' },
  { value: 'hu', name: 'Magyar' },
  { value: 'nl', name: 'Nederlands' },
  { value: 'nb', name: 'Norsk bokmål' },
  { value: 'pl', name: 'Polski' },
  { value: 'pt-br', name: 'Português brasileiro' },
  { value: 'sr', name: 'Srpski' },
  { value: 'vi', name: 'Tiếng Việt' },
  { value: 'tr', name: 'Türkçe' },
  { value: 'fil', name: 'Filipino' },
  { value: 'ru', name: 'Русский' },
  { value: 'uk', name: 'Українська' },
  { value: 'th', name: 'ภาษาไทย' },
  { value: 'km', name: 'ភាសាខ្មែរ' },
  { value: 'ko', name: '한국어' },
  { value: 'ja', name: '日本語' },
  { value: 'zh-cn', name: '汉语' },
];

const BITCOIN_FAMILY = ['bitcoin', 'bitcoin-cash', 'bitcoin-sv', 'litecoin', 'dogecoin', 'dash'];

export default function(el) {
  const currency = details.get('systemInfo').preferredCurrency;
  const language = i18n.getLanguage(details.get('systemInfo').language);
  const ractive = new Ractive({
    el,
    template,
    data: {
      avatar: '',
      username: '',
      isEnabledImport: true,
      isEnabledExport: true,
      isBitcoinFamily: false,
      isEOS: false,
      securityPinLabel: getSecurityPinLabel(),
      walletName: '',
      currencies: [
        'ARS', 'AUD', 'BRL', 'CAD', 'CHF', 'CNY',
        'DKK', 'EUR', 'GBP', 'IDR', 'ILS',
        'JPY', 'MXN', 'NOK', 'NZD', 'PLN',
        'RUB', 'SEK', 'SGD', 'TRY', 'UAH',
        'USD', 'ZAR',
      ],
      currency,
      languages,
      language,
      getLanguageLabel(language) {
        const option = languages.find((item) => item.value === language);
        return option ? option.name : '';
      },
    },
  });

  ractive.on('before-show', () => {
    const wallet = CS.getWallet();
    ractive.set('isEOS', wallet.crypto.platform === 'eos');
    ractive.set('isBitcoinFamily', BITCOIN_FAMILY.includes(wallet.crypto.platform));
    ractive.set('walletName', wallet.crypto.name);
    if (wallet.crypto.platform === 'eos') {
      ractive.set('isEnabledImport', false);
      ractive.set('isEnabledExport', true);
    } else if (wallet.crypto.platform === 'monero') {
      ractive.set('isEnabledImport', false);
      ractive.set('isEnabledExport', true);
    } else if (wallet.crypto.platform === 'bitcoin-sv') {
      ractive.set('isEnabledImport', false);
      ractive.set('isEnabledExport', true);
    } else {
      ractive.set('isEnabledImport', true);
      ractive.set('isEnabledExport', true);
    }
  });

  ractive.on('account', () => {
    ractive.fire('change-step', { step: 'account' });
  });

  ractive.on('security-pin', () => {
    ractive.fire('change-step', { step: 'securityPin' });
  });
  ractive.on('security-hardware', () => {
    ractive.fire('change-step', { step: 'securityHardware' });
  });

  ractive.on('before-show', ({ userInfo }) => {
    if (userInfo) {
      const avatar = Avatar.getAvatar(64);
      ractive.set('avatar', avatar.url);
      ractive.set('username', userInfo.username || translate('Your username'));
    }
  });

  ractive.on('import-private-key', importPrivateKey);
  ractive.on('export-private-keys', exportPrivateKeys);
  ractive.on('eos-setup-account', showEosSetupAccount);
  ractive.on('derivation-path', derivationPath);

  ractive.on('support', () => {
    const version = `${process.env.VERSION}@${process.env.PLATFORM} (${process.env.COMMIT})`;
    if (process.env.BUILD_TYPE === 'phonegap') {
      window.Zendesk.showHelpCenter(null, null, null, version);
    } else {
      window.safeOpen('https://support.coin.space/hc/en-us/sections/115000511287-FAQ', '_blank');
    }
  });

  ractive.on('about', () => {
    ractive.fire('change-step', { step: 'about' });
  });

  ractive.on('logout', () => {
    LS.reset();
    location.reload();
  });

  ractive.on('setPreferredCurrency', () => {
    const currency = ractive.get('currency');
    details.set('systemInfo', {
      preferredCurrency: currency,
    }).then(() => {
      emitter.emit('currency-changed', currency);
    }, (err) => {
      console.error(err);
    });
  });

  ractive.on('setLanguage', () => {
    const language = i18n.getLanguage(ractive.get('language'));
    details.set('systemInfo', {
      language,
    }).then(() => {
      localStorage.setItem('_cs_language', language);
      return location.reload();
    }, (err) => {
      console.error(err);
    });
  });

  return ractive;
}

function getSecurityPinLabel() {
  if (!touchId.isAvailable()) return translate('PIN');
  if (os === 'ios' || os === 'macos') {
    return translate('PIN & Touch ID');
  } else if (os === 'android') {
    return translate('PIN & Fingerprint');
  } else {
    return translate('PIN & Biometrics');
  }
}
