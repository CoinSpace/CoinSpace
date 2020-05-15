'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var moonpay = require('lib/moonpay');
var getWallet = require('lib/wallet').getWallet;
var showError = require('widgets/modals/flash').showError;

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
      isLoadingSignIn: false,
      step: 1,
      email: '',
      code: ''
    },
    partials: {
      loader: require('../loader.ract'),
    }
  });

  ractive.on('before-show', function() {
    ractive.set('step', 1);
    ractive.set('email', '');
    ractive.set('code', '');
    var wallet = getWallet();
    if (!(moonpay.isSupported(wallet.denomination) && wallet.getNextAddress())) {
      return emitter.emit('set-exchange', 'none');
    }

    if (moonpay.isLogged()) {
      ractive.set('isLoading', true);
      return moonpay.refreshToken().then(function(data) {
        moonpay.setAccessToken(data.token);
        moonpay.setCustomer(data.customer);
        emitter.emit('change-moonpay-step', 'main');
      }).catch(function(err) {
        ractive.set('isLoading', false);
        moonpay.cleanAccessToken();
        moonpay.cleanCustomer();
        console.error(err);
      });
    }
    ractive.set('isLoading', false);
  });

  ractive.on('back', function() {
    if (ractive.get('step') === 1) {
      emitter.emit('set-exchange', 'none');
    } else {
      ractive.set('step', 1);
    }
  });

  ractive.on('sign-in', function() {
    ractive.set('isLoadingSignIn', true);
    var securityCode = ractive.get('step') === 2 ? ractive.get('code').trim() : undefined;
    return moonpay.signIn(ractive.get('email').trim(), securityCode).then(function(data) {
      ractive.set('isLoadingSignIn', false);
      if (data.preAuthenticated) return ractive.set('step', 2);
      moonpay.setAccessToken(data.token);
      moonpay.setCustomer(data.customer);
      emitter.emit('change-moonpay-step', 'main');
    }).catch(function(err) {
      ractive.set('isLoadingSignIn', false);
      if (err.message === 'invalid_email') {
        return showError({message: 'Please enter a valid email address'});
      }
      if (err.message === 'invalid_email_disposable') {
        return showError({message: "Sorry, we don't accept disposable email addresses"});
      }
      if (err.message === 'invalid_security_code') {
        return showError({message: 'Invalid verification code'});
      }
      console.error(err);
      return showError({message: err.message});
    });
  });

  return ractive;
}
