'use strict';

var Ractive = require('widgets/modals/base');
var showError = require('widgets/modals/flash').showError;
var moonpay = require('lib/moonpay');

var ractive;

function open() {

  var customer = moonpay.getCustomer();

  ractive = new Ractive({
    partials: {
      content: require('./_content.ract')
    },
    data: {
      isLoading: false,
      step: 1,
      phoneNumber: customer.phoneNumber || '',
      code: ''
    }
  });

  ractive.on('verify', function() {
    ractive.set('isLoading', true);

    var phoneNumber = ractive.get('phoneNumber').trim();
    if (!phoneNumber) return handleError(new Error('Please enter a valid info'));

    return moonpay.updateCustomer({
      phoneNumber: phoneNumber
    }).then(function() {
      ractive.set('isLoading', false);
      ractive.set('step', 2);
    }).catch(function(err) {
      if (/You must enter a mobile phone number valid for your country/.test(err.message)) {
        return handleError(new Error('You must enter a mobile phone number valid for your country'));
      }
      console.error(err);
      return handleError(new Error('Please enter a valid info'));
    });
  });

  ractive.on('back', function() {
    ractive.set('step', 1);
  });

  ractive.on('submit', function() {
    ractive.set('isLoading', true);
    var code = ractive.get('code').trim();
    return moonpay.verifyPhoneNumber(code).then(function() {
      ractive.fire('cancel');
    }).catch(function() {
      return handleError(new Error('Code is invalid or expired. Please try again.'));
    });
  });

  function handleError(err) {
    ractive.set('isLoading', false);
    showError({message: err.message});
  }

  return ractive;
}

module.exports = open;
