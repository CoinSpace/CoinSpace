'use strict';

const Ractive = require('widgets/modals/base');
const { showError } = require('widgets/modals/flash');
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
      removing: false,
    },
  });

  ractive.on('remove', async () => {

    try {
      await unlock();
    } catch (err) {
      return;
    }

    try {
      ractive.set('removing', true);
      await CS.removeAccount();
      ractive.set('confirmation', false);
      ractive.set('success', true);
      setTimeout(() => {
        location.reload();
      }, 3000);
    } catch (err) {
      lock();
      ractive.set('removing', false);
      showError({ message: err.message });
    }
  });

  ractive.on('reload', () => {
    location.reload();
  });

  return ractive;
}

module.exports = open;
