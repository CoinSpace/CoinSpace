'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var showIdentityVerification = require('widgets/modals/moonpay/identity-verification');
var showPhoneNumberVerification = require('widgets/modals/moonpay/phone-number-verification');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
      customerVerifications: [],
      getVerificationName: function(key) {
        return verifications[key].name;
      },
      showVerification: function(key) {
        verifications[key].show();
      }
    },
    partials: {
      loader: require('../loader.ract'),
    }
  });

  var verifications = {
    identity_verification: {
      name: 'Identity',
      show: showIdentityVerification
    },
    phone_number_verification: {
      name: 'Phone number',
      show: showPhoneNumberVerification
    },
    document_verification: {
      name: 'Document'
    },
    face_match_verification: {
      name: 'Face match'
    }
  }

  ractive.on('before-show', function(context) {
    ractive.set('isLoading', false);
    var customerVerifications = [];
    context.verificationLevels.forEach(function(level) {
      level.requirements.forEach(function(item) {
        if (verifications[item.identifier]) {
          customerVerifications.push(item);
        }
      });
    });
    ractive.set('customerVerifications', customerVerifications);
  });

  ractive.on('back', function() {
    emitter.emit('change-moonpay-step', 'main');
  });

  return ractive;
}
