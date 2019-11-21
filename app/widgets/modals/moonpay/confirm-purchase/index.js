'use strict';

var Ractive = require('widgets/modals/base');
var showError = require('widgets/modals/flash').showError;
var getWallet = require('lib/wallet').getWallet;
var moonpay = require('lib/moonpay');

var ractive;

function open(data) {

  ractive = new Ractive({
    partials: {
      content: require('./_content.ract')
    },
    data: {
      isLoading: false,
      status: 'confirm',
      card: data.card,
      fiatAmount: data.fiatAmount,
      fiatSymbol: data.fiatSymbol,
      cryptoAmount: data.cryptoAmount,
      cryptoSymbol: data.cryptoSymbol,
      address: getWallet().getNextAddress(),
      threedsecure: function() {}
    }
  });

  ractive.on('confirm', function() {
    ractive.set('isLoading', true);

    var redirectURL = process.env.SITE_URL + 'moonpay/redirectURL?buildType=web';
    if (process.env.BUILD_TYPE === 'phonegap') {
      redirectURL = process.env.SITE_URL + 'moonpay/redirectURL?buildType=phonegap';
    }

    return moonpay.createTx({
      baseCurrencyAmount: data.fiatAmount,
      areFeesIncluded: true,
      walletAddress: ractive.get('address'),
      baseCurrencyCode: data.fiatSymbol.toLowerCase(),
      currencyCode: data.cryptoSymbol.toLowerCase(),
      returnUrl: redirectURL,
      card: data.card
    }).then(function(tx) {
      if (tx.status === 'failed') throw new Error('failed');
      if (tx.status === 'waitingAuthorization') {
        return waitingAuthorization(tx.redirectUrl);
      }
      ractive.set('status', 'success');
    }).catch(function(err) {
      if (/daily limit/.test(err.message)) {
        return handleError(new Error('You have exceeded your daily limit. Please try again later.'));
      }
      if (/monthly limit/.test(err.message)) {
        return handleError(new Error('You have exceeded your monthly limit. Please try again later.'));
      }
      if (err.message === 'apple_pay_cancelled') {
        return ractive.set('isLoading', false);
      }
      console.error(err);
      return handleError(new Error('Make sure that your card is valid and has sufficient available balance.'));
    });
  });

  function waitingAuthorization(redirectUrl) {
    ractive.set('isLoading', false);
    ractive.set('status', 'waitingAuthorization');
    ractive.set('threedsecure', function() {
      ractive.set('isLoading', true);
      moonpay.open3dSecure(redirectUrl).then(function() {
        ractive.set('status', 'success');
      }).catch(function(err) {
        console.error(err);
        return handleError(new Error('3D secure authentication failed'));
      });
    });
  }

  function handleError(err) {
    ractive.set('isLoading', false);
    showError({message: err.message});
  }

  return ractive;
}

module.exports = open;
