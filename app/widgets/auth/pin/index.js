'use strict';

const Ractive = require('../auth');
const CS = require('lib/wallet');
const emitter = require('lib/emitter');
const validatePin = require('lib/pin-validator');
const { showError } = require('widgets/modals/flash');
const { translate } = require('lib/i18n');
const shapeshift = require('lib/shapeshift');
const moonpay = require('lib/moonpay');
let pincode = '';

module.exports = function(prevPage, data) {
  data = data || {};
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
      initFingerprintAuth().catch(() => {
        ractive.find('#setPin').focus();
      });
    },
  });

  ractive.on('focus-pin', () => {
    ractive.set('pinfocused', true);
  });

  ractive.on('blur-pin', () => {
    ractive.set('pinfocused', false);
  });

  function pinCode(pin) {
    return function() {
      const pinParts = pin.split('');
      let pinString = '';
      for (let i=0; i<pinParts.length; i++) {
        if ((parseInt(pinParts[i]) || parseInt(pinParts[i]) === 0) && typeof parseInt(pinParts[i]) === 'number') {
          pinString += pinParts[i];
        }
      }
      pincode = pinString;
      return pincode;
    };
  }

  ractive.observe('pin', () => {
    const pin = ractive.find('#setPin').value;
    const p = pinCode(pin);
    const boxes = p().split('');

    if (boxes.length === 4) {
      ractive.find('#setPin').blur();
      ractive.fire('enter-pin');
    } else {
      setTimeout(() => {
        ractive.set('pin', pincode);
      }, 0);
    }

    setBoxes(boxes);
  });

  ractive.on('enter-pin', () => {

    setTimeout(() => {

      if (!validatePin(getPin())) {
        emitter.emit('clear-pin');
        return showError({ message: 'PIN must be a 4-digit number' });
      }

      ractive.set('opening', true);

      if (userExists) {
        ractive.set('progress', 'Verifying PIN');
        if (CS.walletExists()) {
          return openWithPin();
        }
        return setPin();
      }
      ractive.set('progress', 'Setting PIN');
      ractive.set('userExists', true);
      setPin();

    }, 500);

  });

  emitter.on('clear-pin', () => {
    ractive.find('#setPin').value = '';
    ractive.set('pin', '');
    setBoxes([]);
  });

  ractive.on('clear-credentials', () => {
    CS.reset();
    CS.resetPin();
    shapeshift.cleanAccessToken();
    moonpay.cleanAccessToken();
    location.reload();
  });

  ractive.on('back', () => {
    if (prevPage) prevPage(data);
  });

  function getPin() {
    const pin = pincode || ractive.get('pin');
    return pin ? pin.toString() : '';
  }

  function setBoxes(boxes) {
    for (let i = boxes.length; i < 4; i++) {
      boxes[i] = null;
    }
    ractive.set('boxes', boxes);
  }

  function openWithPin() {
    CS.openWalletWithPin(getPin(), ractive.getTokenNetwork(), ractive.onSyncDone);
  }

  function setPin() {
    CS.setPin(getPin(), ractive.getTokenNetwork(), ractive.onSyncDone);
  }

  function initFingerprintAuth() {
    return new Promise((resolve, reject) => {
      if (process.env.BUILD_PLATFORM === 'ios') {
        window.plugins.touchid.isAvailable(() => {
          CS.setAvailableTouchId();
          const pin = CS.getPin();
          if (pin && CS.walletExists() && userExists) {
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
          CS.setAvailableTouchId();
          const pin = CS.getPin();
          if (pin && CS.walletExists() && userExists) {
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

