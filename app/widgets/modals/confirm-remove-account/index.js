'use strict';

const Ractive = require('widgets/modals/base');
const CS = require('lib/wallet');
const { unlock, lock } = require('lib/wallet/security');
const { showSuccess } = require('widgets/modals/flash');

function open() {

  const ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
    },
    data: {
      isLoading: false,
    },
  });

  ractive.on('remove', async () => {
    ractive.set('isLoading', true);

    try {
      await unlock();
      await CS.removeAccount();
      lock();
      showSuccess({
        el: ractive.el,
        title: 'Account has been successfully removed',
        message: 'This page will be reloaded shortly.',
        fadeInDuration: 0,
      });

      setTimeout(() => {
        location.reload();
      }, 3000);
    } catch (err) {
      lock();
      if (err.message !== 'cancelled') console.error(err);
    }

    ractive.set('isLoading', false);
  });

  return ractive;
}

module.exports = open;
