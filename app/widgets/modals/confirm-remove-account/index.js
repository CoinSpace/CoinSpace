import Ractive from 'widgets/modals/base';
import CS from 'lib/wallet';
import { unlock, lock } from 'lib/wallet/security';
import { showSuccess } from 'widgets/modals/flash';
import content from './_content.ract';

function open() {

  const ractive = new Ractive({
    partials: {
      content,
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

export default open;
