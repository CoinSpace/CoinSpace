'use strict';

const Ractive = require('widgets/modals/base');
const CS = require('lib/wallet');
const { unlock, lock } = require('lib/wallet/security');

function open() {

  const ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
    },
    data: {
      confirmation: true,
      success: false,
      isLoading: false,
    },
  });

  ractive.on('remove', async () => {
    ractive.set('isLoading', true);

    try {
      await unlock();
      await CS.removeAccount();
      lock();
      ractive.set('confirmation', false);
      ractive.set('success', true);
      setTimeout(() => {
        location.reload();
      }, 3000);
    } catch (err) {
      lock();
      if (err.message !== 'cancelled') console.error(err);
    }

    ractive.set('isLoading', false);
  });

  ractive.on('reload', () => {
    location.reload();
  });

  return ractive;
}

module.exports = open;
