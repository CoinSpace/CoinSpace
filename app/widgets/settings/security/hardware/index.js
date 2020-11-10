'use strict';

const Ractive = require('lib/ractive');
const security = require('lib/wallet/security');
const strftime = require('strftime');
const hardware = require('lib/hardware');
const PassphraseWidget = require('widgets/passphrase');
const CS = require('lib/wallet');
const settings = require('lib/wallet/settings');
const MAX_AUTHENTICATORS = 10;

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
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
      loader: require('partials/loader/loader.ract'),
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
};
