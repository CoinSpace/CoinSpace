import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import CS from 'lib/wallet';
import { showError } from 'widgets/modals/flash';
import template from './index.ract';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
    data: {
      isLoading: false,
    },
  });

  ractive.on('before-show', () => {
    ractive.set('isLoading', false);
  });

  ractive.on('generate-phrase', async () => {
    ractive.set('isLoading', true);
    try {
      const { mnemonic } = await CS.createWallet(null);
      emitter.emit('change-auth-step', 'createPassphrase', {
        passphrase: mnemonic,
      });
    } catch (err) {
      ractive.set('isLoading', false);
      showError(err);
    }
  });

  ractive.on('back', () => {
    emitter.emit('change-auth-step', 'choose');
  });

  return ractive;
}

