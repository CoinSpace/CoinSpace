'use strict';

const Ractive = require('widgets/modals/base');
const { showError } = require('widgets/modals/flash');
const moonpay = require('lib/moonpay');

let ractive;

function open() {

  const customer = moonpay.getCustomer();

  ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
    },
    data: {
      isLoading: false,
      step: 1,
      phoneNumber: customer.phoneNumber || '',
      code: '',
    },
  });

  ractive.on('verify', () => {
    ractive.set('isLoading', true);

    const phoneNumber = ractive.get('phoneNumber').trim();
    if (!phoneNumber) return handleError(new Error('Please enter a valid info'));

    return moonpay.updateCustomer({
      phoneNumber,
    }).then(() => {
      ractive.set('isLoading', false);
      ractive.set('step', 2);
    }).catch((err) => {
      if (/You must enter a mobile phone number valid for your country/.test(err.message)) {
        return handleError(new Error('You must enter a mobile phone number valid for your country'));
      }
      console.error(err);
      return handleError(new Error('Please enter a valid info'));
    });
  });

  ractive.on('back', () => {
    ractive.set('step', 1);
  });

  ractive.on('submit', () => {
    ractive.set('isLoading', true);
    const code = ractive.get('code').trim();
    return moonpay.verifyPhoneNumber(code).then(() => {
      ractive.fire('cancel');
    }).catch(() => {
      return handleError(new Error('Code is invalid or expired. Please try again.'));
    });
  });

  function handleError(err) {
    ractive.set('isLoading', false);
    showError({ message: err.message });
  }

  return ractive;
}

module.exports = open;
