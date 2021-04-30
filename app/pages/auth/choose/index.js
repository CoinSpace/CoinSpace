import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import PinWidget from 'widgets/pin';
import PassphraseWidget from 'widgets/passphrase';
import { translate } from 'lib/i18n';
import CS from 'lib/wallet';
import LS from 'lib/wallet/localStorage';
import template from './index.ract';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
  });

  ractive.on('create-new-wallet', () => {
    emitter.emit('change-auth-step', 'create');
  });

  ractive.on('reveal-passphrase-input', () => {
    ractive.passphraseWidget = PassphraseWidget({ animation: false }, async (passphrase) => {
      try {
        await CS.createWallet(passphrase);
        ractive.pinWidget = PinWidget({
          header: translate('Set a PIN for quick access'),
          headerLoading: translate('Setting PIN'),
          append: true,
          async onPin(pin) {
            try {
              await CS.registerWallet(pin);
              ractive.pinWidget.loadingWallet();
            } catch (err) {
              ractive.pinWidget.wrong();
              emitter.emit('auth-error', err);
            }
          },
        });
        ractive.pinWidget.on('back', () => {
          ractive.passphraseWidget.set('isLoading', false);
        });
      } catch (err) {
        ractive.passphraseWidget.wrong(err);
      }
    });
  });

  ractive.showPin = () => {
    ractive.pinWidget = PinWidget({
      backLabel: translate('Logout'),
      touchId: true,
      async onPin(pin) {
        try {
          await CS.loginWithPin(pin);
          ractive.pinWidget.loadingWallet();
        } catch (err) {
          ractive.pinWidget.wrong();
          emitter.emit('auth-error', err);
        }
      },
      async onTouchId() {
        try {
          await CS.loginWithTouchId(() => {
            ractive.pinWidget.set('isLoading', true);
          });
          ractive.pinWidget.loadingWallet();
        } catch (err) {
          if (err.message === 'touch_id_error') return;
          ractive.pinWidget.wrong();
          emitter.emit('auth-error', err);
        }
      },
    });

    ractive.pinWidget.on('back', () => {
      LS.reset();
      emitter.emit('change-auth-step', 'choose');
    });
  };

  return ractive;
}
