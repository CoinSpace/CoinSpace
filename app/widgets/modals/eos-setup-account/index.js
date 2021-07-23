import Ractive from 'widgets/modals/base';
import { getWallet } from 'lib/wallet';
import { initWallet } from 'lib/wallet';
import details from 'lib/wallet/details';
import { showError, showSuccess } from 'widgets/modals/flash';
import { translate } from 'lib/i18n';
import emitter from 'lib/emitter';
import content from './_content.ract';

function open() {
  const ractive = new Ractive({
    partials: {
      content,
    },
    data: {
      isLoading: false,
      accountName: '',
      showInstruction: false,
      price: '',
      memo: '',
      isPhonegap: process.env.BUILD_TYPE === 'phonegap',
    },
  });

  ractive.on('confirm', () => {
    ractive.set('isLoading', true);
    const wallet = getWallet();
    const accountName = ractive.get('accountName').trim();
    wallet.setupAccount(accountName).then((result) => {
      ractive.set('isLoading', false);
      if (result.needToCreateAccount) {
        ractive.set('showInstruction', true);
        ractive.set('price', result.price + ' EOS');
        ractive.set('memo', result.memo);
      } else {
        details.set('eosAccountName', accountName).then(() => {
          showSuccess({
            el: ractive.el,
            message: translate('Account has been successfully set up'),
            fadeInDuration: 0,
          });
          syncWallet();
        });
      }
    }).catch((err) => {
      ractive.set('isLoading', false);
      if (/Invalid account name/.test(err.message)) {
        return showError({ message: translate('Invalid account name') });
      } else if (/Account name is already taken/.test(err.message)) {
        return showError({ message: translate('This account name is already taken, please choose another one.') });
      } else if (err.message === 'cs-node-error') {
        return showError({
          message: translate('Network node error. Please try again later.', { network: 'EOS' }),
        });
      }
      console.error(`not translated error: ${err.message}`);
      return showError({ message: err.message });
    });
  });

  function syncWallet() {
    emitter.emit('sync');
    setTimeout(() => {
      initWallet();
    }, 200);
  }

  ractive.on('clearAccountName', () => {
    const input = ractive.find('#account_name');
    ractive.set('accountName', '');
    input.focus();
  });

  ractive.on('share-memo', () => {
    window.plugins.socialsharing.shareWithOptions({
      message: ractive.get('memo'),
    });
  });
  ractive.on('share-address', () => {
    window.plugins.socialsharing.shareWithOptions({
      message: 'coinappsetup',
    });
  });

  ractive.on('back', () => {
    ractive.set('showInstruction', false);
  });

  return ractive;
}

export default open;
