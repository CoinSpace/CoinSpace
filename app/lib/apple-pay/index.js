'use strict';

function isApplePaySupported() {
  var ApplePaySession = window.ApplePaySession;
    return (
      ApplePaySession &&
      ApplePaySession.canMakePayments() &&
      ApplePaySession.supportsVersion(2)
    );
}

function generateToken(options) {
  var request = {
    countryCode: options.countryCode,
    currencyCode: options.currencyCode,
    merchantCapabilities: ['supports3DS'],
    supportedNetworks: ['visa', 'masterCard'],
    lineItems: options.lineItems || [],
    total: options.total
  };
  return new Promise(function(resolve, reject) {
    var session = new window.ApplePaySession(2, request);

    session.onvalidatemerchant = function(e) {
      options.validateApplePayTransaction(e.validationURL).then(function(merchantSession) {
        session.completeMerchantValidation(merchantSession);
      });
    };

    session.onpaymentauthorized = function(e) {
      console.log('e', e);
      options.callback(e.payment.token).then(function() {
        session.completePayment(0);
        resolve();
      }).catch(function(err) {
        console.error(err);
        session.completePayment(1);
        reject(new Error('This payment has been declined.'));
      });
    }

    session.oncancel = function() {
      reject(new Error('The user cancelled this transaction.'));
    };

    session.begin();
  });
}

module.exports = {
  isApplePaySupported: isApplePaySupported,
  generateToken: generateToken
}
