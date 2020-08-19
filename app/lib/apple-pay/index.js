'use strict';

function isApplePaySupported() {
  const { ApplePaySession } = window;
  return (
    window.location.protocol === 'https:' &&
      ApplePaySession &&
      ApplePaySession.canMakePayments() &&
      ApplePaySession.supportsVersion(2)
  );
}

function generateToken(options) {
  const request = {
    countryCode: options.countryCode,
    currencyCode: options.currencyCode,
    merchantCapabilities: ['supports3DS'],
    supportedNetworks: ['visa', 'masterCard'],
    lineItems: options.lineItems || [],
    total: options.total,
  };
  return new Promise((resolve, reject) => {
    const session = new window.ApplePaySession(2, request);

    session.onvalidatemerchant = function(e) {
      options.validateApplePayTransaction(e.validationURL).then((merchantSession) => {
        session.completeMerchantValidation(merchantSession);
      });
    };

    session.onpaymentauthorized = function(e) {
      options.callback(JSON.stringify(e.payment.token)).then(() => {
        session.completePayment(0);
        resolve();
      }).catch((err) => {
        console.error(err);
        session.completePayment(1);
        reject(new Error('apple_pay_declined'));
      });
    };

    session.oncancel = function() {
      reject(new Error('apple_pay_cancelled'));
    };

    session.begin();
  });
}

module.exports = {
  isApplePaySupported,
  generateToken,
};
