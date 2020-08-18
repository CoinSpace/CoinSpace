'use strict';

const Ractive = require('../auth');
const CS = require('lib/wallet');
const emitter = require('lib/emitter');
const validatePin = require('lib/pin-validator');
const { showError } = require('widgets/modals/flash');
const { translate } = require('lib/i18n');

module.exports = function(prevPage, data = {}) {
  const userExists = data.userExists;

  const ractive = new Ractive({
    partials: {
      header: require('./header.ract'),
      content: require('./content.ract'),
      footer: require('./footer.ract'),
    },
    data: {
      userExists,
      pin: '',
      boxes: [null, null, null, null],
      visible(number) {
        return number != null;
      },
    },
    oncomplete() {
      if (CS.getPinDEPRECATED()) {
        initFingerprintAuth().catch(() => {
          ractive.find('#setPin').focus();
        });
      } else {
        ractive.find('#setPin').focus();
      }
    },
  });

  ractive.on('focus-pin', () => {
    ractive.set('pinfocused', true);
  });

  ractive.on('blur-pin', () => {
    ractive.set('pinfocused', false);
  });

  ractive.observe('pin', (pin) => {
    const boxes = pin.split('')
      .map(part => parseInt(part, 10))
      .filter(part => !isNaN(part));

    setBoxes(boxes);

    if (boxes.length === 4) {
      ractive.find('#setPin').blur();
      ractive.fire('enter-pin', {}, boxes);
    } else {
      ractive.set('pin', boxes.join(''));
    }
  });

  ractive.on('enter-pin', (context, pin) => {
    // It should never happened
    if (!validatePin(pin.join(''))) {
      emitter.emit('clear-pin');
      return showError({ message: 'PIN must be a 4-digit number' });
    }

    ractive.set('opening', true);

    if (CS.walletExistsDEPRECATED()) {
      CS.openWalletWithPinDEPRECATED(pin.join(''), 'stub', (err) => {
        if (err) {
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
            emitter.emit('auth-error', err);
          });
      });
      return;
    }

    if (userExists) {
      ractive.set('progress', 'Verifying PIN');
      CS.loginWithPin(pin)
        .then(() => {
          emitter.emit('auth-success');
        })
        .catch(err => {
          emitter.emit('auth-error', err);
        });
    } else {
      ractive.set('progress', 'Setting PIN');
      ractive.set('userExists', true);

      CS.registerWallet(pin)
        .then(() => {
          emitter.emit('auth-success');
        })
        .catch(err => {
          emitter.emit('auth-error', err);
        });
    }
  });

  emitter.on('clear-pin', () => {
    ractive.set('opening', false);
    ractive.set('pin', '');
    setBoxes([]);
  });

  ractive.on('clear-credentials', () => {
    CS.reset();
    location.reload();
  });

  ractive.on('back', () => {
    if (prevPage) prevPage(data);
  });

  function setBoxes(boxes) {
    ractive.set('boxes', [
      boxes[0],
      boxes[1],
      boxes[2],
      boxes[3],
    ]);
  }

  function initFingerprintAuth() {
    return new Promise((resolve, reject) => {
      if (process.env.BUILD_PLATFORM === 'ios') {
        window.plugins.touchid.isAvailable(() => {
          const pin = CS.getPinDEPRECATED();
          if (pin && CS.walletExistsDEPRECATED() && userExists) {
            window.plugins.touchid.verifyFingerprintWithCustomPasswordFallbackAndEnterPasswordLabel(
              translate('Scan your fingerprint please'),
              translate('Enter PIN'),
              () => {
                resolve();
                ractive.set('pin', pin);
                const boxes = pin.split('');
                setBoxes(boxes);
              }, reject
            );
          } else {
            reject();
          }
        }, reject);
      } else if (process.env.BUILD_PLATFORM === 'android') {
        const Fingerprint = window.Fingerprint;
        Fingerprint.isAvailable(() => {
          const pin = CS.getPinDEPRECATED();
          if (pin && CS.walletExistsDEPRECATED() && userExists) {
            Fingerprint.show({}, () => {
              resolve();
              ractive.set('pin', pin);
              const boxes = pin.split('');
              setBoxes(boxes);
            }, reject);
          } else {
            reject();
          }
        }, reject);
      } else {
        reject();
      }
    });
  }

  return ractive;
};

