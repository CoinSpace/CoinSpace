'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const PinWidget = require('widgets/pin');
const PassphraseWidget = require('widgets/passphrase');
const { translate } = require('lib/i18n');
const CS = require('lib/wallet');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
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
          }
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
        // TODO: migration
        // if (CS.walletExistsDEPRECATED()) {
        //   CS.openWalletWithPinDEPRECATED(pin, 'stub', (err) => {
        //     if (err) {
        //       ractive.pinWidget.wrong();
        //       emitter.emit('auth-error', err);
        //       return;
        //     }
        //     CS.migrateWallet(pin)
        //       .then(() => {
        //         emitter.emit('auth-success');
        //         CS.deleteCredentialsDEPRECATED();
        //         if (CS.getPinDEPRECATED()) {
        //           CS.resetPinDEPRECATED();
        //           emitter.emit('re-enable-touchid');
        //         }
        //       })
        //       .catch(err => {
        //         ractive.pinWidget.wrong();
        //         emitter.emit('auth-error', err);
        //       });
        //   });
        //   return;
        // }

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
          await CS.loginWithTouchId();
          ractive.pinWidget.loadingWallet();
        } catch (err) {
          console.error(err);
        }
      }
    });

    ractive.pinWidget.fire('touch-id');

    ractive.pinWidget.on('back', () => {
      CS.reset();
      emitter.emit('change-auth-step', 'choose');
    });
  };

  return ractive;
};

