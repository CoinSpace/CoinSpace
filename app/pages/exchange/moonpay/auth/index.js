'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const moonpay = require('lib/moonpay');
const { getWallet } = require('lib/wallet');
const { showError } = require('widgets/modals/flash');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
      isLoadingSignIn: false,
      step: 1,
      email: '',
      code: '',
    },
    partials: {
      loader: require('../loader.ract'),
    },
  });

  ractive.on('before-show', () => {
    ractive.set('step', 1);
    ractive.set('email', '');
    ractive.set('code', '');
    const wallet = getWallet();
    if (!(moonpay.isSupported(wallet.denomination) && wallet.getNextAddress())) {
      return emitter.emit('set-exchange', 'none');
    }

    if (moonpay.isLogged()) {
      ractive.set('isLoading', true);
      return moonpay.refreshToken().then((data) => {
        moonpay.setAccessToken(data.token);
        moonpay.setCustomer(data.customer);
        emitter.emit('change-moonpay-step', 'main');
      }).catch((err) => {
        ractive.set('isLoading', false);
        moonpay.cleanAccessToken();
        moonpay.cleanCustomer();
        console.error(err);
      });
    }
    ractive.set('isLoading', false);
  });

  ractive.on('back', () => {
    if (ractive.get('step') === 1) {
      emitter.emit('set-exchange', 'none');
    } else {
      ractive.set('step', 1);
    }
  });

  ractive.on('sign-in', () => {
    ractive.set('isLoadingSignIn', true);
    const securityCode = ractive.get('step') === 2 ? ractive.get('code').trim() : undefined;
    return moonpay.signIn(ractive.get('email').trim(), securityCode).then((data) => {
      ractive.set('isLoadingSignIn', false);
      if (data.preAuthenticated) return ractive.set('step', 2);
      moonpay.setAccessToken(data.token);
      moonpay.setCustomer(data.customer);
      emitter.emit('change-moonpay-step', 'main');
    }).catch((err) => {
      ractive.set('isLoadingSignIn', false);
      if (err.message === 'invalid_email') {
        return showError({ message: 'Please enter a valid email address' });
      }
      if (err.message === 'invalid_email_disposable') {
        return showError({ message: "Sorry, we don't accept disposable email addresses" });
      }
      if (err.message === 'invalid_security_code') {
        return showError({ message: 'Invalid verification code' });
      }
      console.error(err);
      return showError({ message: err.message });
    });
  });

  return ractive;
};
