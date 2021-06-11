import Ractive from 'widgets/modals/base';
import { getWallet } from 'lib/wallet';
import { unlock, lock } from 'lib/wallet/security';
import { showInfo } from 'widgets/modals/flash';
import { translate } from 'lib/i18n';
import content from './content.ract';

function open() {
  const ractive = new Ractive({
    partials: {
      content,
    },
    data: {
      isShown: false,
      privateKeys: '',
      isPhonegap: process.env.BUILD_TYPE === 'phonegap',
    },
  });

  let isLoading = false;

  ractive.on('show-keys', async () => {
    if (isLoading) return;
    isLoading = true;

    const wallet = getWallet();
    try {
      await unlock(wallet);
      const privateKeys = wallet.exportPrivateKeys();
      lock(wallet);
      if (privateKeys.length === 0) {
        ractive.fire('cancel');
        return showInfo({
          message: translate('Your wallet has no private keys with coins for export.'),
          fadeInDuration: 0,
        });
      }
      ractive.set('privateKeys', privateKeys);
      ractive.set('isShown', true);
    } catch (err) {
      lock(wallet);
      if (err.message !== 'cancelled') console.error(err);
    }

    isLoading = false;
  });

  ractive.on('export-keys', () => {
    window.plugins.socialsharing.shareWithOptions({
      message: ractive.get('privateKeys'),
    });
  });

  return ractive;
}

export default open;
