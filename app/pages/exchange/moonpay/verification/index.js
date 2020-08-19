'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const showIdentityVerification = require('widgets/modals/moonpay/identity-verification');
const showPhoneNumberVerification = require('widgets/modals/moonpay/phone-number-verification');
const showFaceMatchVerification = require('widgets/modals/moonpay/face-match-verification');
const showDocumentVerification = require('widgets/modals/moonpay/document-verification');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      customerVerifications: [],
      getVerificationName(key) {
        return verifications[key].name;
      },
      showVerification(key) {
        verifications[key].show();
      },
    },
    partials: {
      loader: require('../loader.ract'),
    },
  });

  const verifications = {
    identity_verification: {
      name: 'Identity',
      show: showIdentityVerification,
    },
    phone_number_verification: {
      name: 'Phone number',
      show: showPhoneNumberVerification,
    },
    document_verification: {
      name: 'Document',
      show: showDocumentVerification,
    },
    face_match_verification: {
      name: 'Face match',
      show: showFaceMatchVerification,
    },
  };

  ractive.on('before-show', (context) => {
    const customerVerifications = [];
    context.verificationLevels.forEach((level) => {
      level.requirements.forEach((item) => {
        if (verifications[item.identifier]) {
          customerVerifications.push(item);
        }
      });
    });
    ractive.set('customerVerifications', customerVerifications);
  });

  ractive.on('back', () => {
    emitter.emit('change-moonpay-step', 'main');
  });

  return ractive;
};
