'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const PinWidget = require('widgets/pin');
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
    console.log('reveal-passphrase-input');
  });

  ractive.showPin = () => {
    ractive.pinWidget = PinWidget({
      backLabel: translate('Logout'),
      touchId: true,
    }, (pin) => {

      if (CS.walletExistsDEPRECATED()) {
        CS.openWalletWithPinDEPRECATED(pin, 'stub', (err) => {
          if (err) {
            ractive.pinWidget.wrong();
            emitter.emit('auth-error', err);
            return;
          }
          CS.migrateWallet(pin)
            .then(() => {
              emitter.emit('auth-success');
              CS.deleteCredentialsDEPRECATED();
              if (CS.getPinDEPRECATED()) {
                CS.resetPinDEPRECATED();
                emitter.emit('re-enable-touchid');
              }
            })
            .catch(err => {
              ractive.pinWidget.wrong();
              emitter.emit('auth-error', err);
            });
        });
        return;
      }

      CS.loginWithPin(pin)
        .then(() => {
          emitter.emit('auth-success');
        })
        .catch(err => {
          ractive.pinWidget.wrong();
          emitter.emit('auth-error', err);
        });
    });

    ractive.pinWidget.fire('touch-id');

    ractive.pinWidget.on('back', () => {
      CS.reset();
      emitter.emit('change-auth-step', 'choose');
    });
  };

  return ractive;
};

