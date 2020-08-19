'use strict';

const Ractive = require('widgets/modals/base');
const { showError } = require('widgets/modals/flash');
const { getWallet } = require('lib/wallet');
const moonpay = require('lib/moonpay');

let ractive;

function open(data) {

  ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
    },
    data: {
      isLoading: false,
      status: data.status || 'confirm',
      paymentMethod: data.paymentMethod,
      fiatAmount: data.fiatAmount,
      fiatSymbol: data.fiatSymbol,
      cryptoAmount: data.cryptoAmount,
      cryptoSymbol: data.cryptoSymbol,
      address: getWallet().getNextAddress(),
      bankTransferReference: '',
      bankDepositInformation: '',
      threedsecure() {},
    },
  });

  ractive.on('confirm', () => {
    ractive.set('isLoading', true);

    let redirectURL;
    // TODO switch phonegap too
    if (process.env.BUILD_TYPE === 'electron') {
      redirectURL =  'coinspace://?action=moonpay-3d-secure';
    } else {
      redirectURL = process.env.SITE_URL + 'v1/moonpay/redirectURL?buildType=' + process.env.BUILD_TYPE;
    }
    return moonpay.createTx({
      baseCurrencyAmount: data.fiatAmount,
      areFeesIncluded: true,
      walletAddress: ractive.get('address'),
      baseCurrencyCode: data.fiatSymbol.toLowerCase(),
      currencyCode: data.cryptoSymbol.toLowerCase(),
      returnUrl: redirectURL,
      paymentMethod: data.paymentMethod,
    }).then((tx) => {
      if (tx.status === 'failed') throw new Error('failed');
      if (tx.status === 'waitingAuthorization') {
        return waitingAuthorization(tx.redirectUrl);
      }
      if (tx.status === 'waitingPayment') {
        return waitingPayment(tx);
      }
      ractive.set('status', 'success');
    }).catch((err) => {
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
    ractive.set('threedsecure', () => {
      ractive.set('isLoading', true);
      moonpay.open3dSecure(redirectUrl).then(() => {
        ractive.set('status', 'success');
      }).catch((err) => {
        if (err.message !== '3d_failed') console.error(err);
        return handleError(new Error('3D secure authentication failed'));
      });
    });
  }

  function waitingPayment(tx) {
    ractive.set('isLoading', false);
    ractive.set('status', 'waitingPayment');
    ractive.set('bankTransferReference', tx.bankTransferReference);
    ractive.set('bankDepositInformation', tx.bankDepositInformation);
  }

  function handleError(err) {
    ractive.set('isLoading', false);
    showError({ message: err.message });
  }

  return ractive;
}

module.exports = open;
