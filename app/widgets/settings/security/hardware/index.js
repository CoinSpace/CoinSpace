import Ractive from 'lib/ractive';
import security from 'lib/wallet/security';
import strftime from 'strftime';
import hardware from 'lib/hardware';
import PassphraseWidget from 'widgets/passphrase';
import CS from 'lib/wallet';
import settings from 'lib/wallet/settings';
import template from './index.ract';
import loader from 'partials/loader/loader.ract';
const MAX_AUTHENTICATORS = 10;

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
    data: {
      MAX_AUTHENTICATORS,
      isLoading: true,
      keys: [],
      formatName(key) {
        const date = new Date(key.date);
        return strftime('%F %T', date);
      },
    },
    partials: {
      loader,
    },
  });

  let isLoadingAdd = false;
  let isLoadingRemove = false;

  ractive.on('back', () => {
    ractive.fire('change-step', { step: 'main' });
  });

  ractive.on('before-show', loadKeys);

  ractive.on('add', async () => {
    if (isLoadingAdd) return;
    isLoadingAdd = true;
    setTimeout(() => isLoadingAdd = false, 1000);
    const { unlock, lock } = security;
    try {
      await unlock();
      await hardware.add();
      lock();
      await loadKeys();
    } catch (err) {
      lock();
      if (err.message !== 'hardware_error' && err.message !== 'cancelled') console.error(err);
    }
  });

  ractive.remove = async (key) => {
    if (isLoadingRemove) return;
    isLoadingRemove = true;
    const { lock } = security;
    const passphraseWidget = PassphraseWidget({}, async (passphrase) => {
      try {
        await CS.createWallet(passphrase);
        await hardware.remove(key);
        lock();
        await loadKeys();
        passphraseWidget.close();
      } catch (err) {
        lock();
        passphraseWidget.wrong(err);
      }
    });
    isLoadingRemove = false;
  };

  async function loadKeys() {
    ractive.set('isLoading', true);
    try {
      const keys = await hardware.list();
      settings.clientSet('hasAuthenticators', keys.length !== 0);
      ractive.set('keys', keys);
    } catch (err) {
      console.error(err);
    }
    ractive.set('isLoading', false);
  }

  return ractive;
}
