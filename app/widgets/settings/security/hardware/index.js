'use strict';

const Ractive = require('lib/ractive');
const security = require('lib/wallet/security');
const strftime = require('strftime');
const hardware = require('lib/hardware');
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
    isLoadingAdd = false;
  });

  ractive.remove = async (key) => {
    if (isLoadingRemove) return;
    isLoadingRemove = true;
    const { unlock, lock } = security;
    try {
      await unlock();
      await hardware.remove(key);
      lock();
      await loadKeys();
    } catch (err) {
      lock();
      if (err.message !== 'hardware_error' && err.message !== 'cancelled') console.error(err);
    }
    isLoadingRemove = false;
  };

  async function loadKeys() {
    ractive.set('isLoading', true);
    try {
      const keys = await hardware.list();
      ractive.set('keys', keys);
    } catch (err) {
      console.error(err);
    }
    ractive.set('isLoading', false);
  }

  return ractive;
};
