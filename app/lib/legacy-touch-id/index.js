'use strict';

const { translate } = require('lib/i18n');

function show() {
  if (!window.legacyTouchIdIsAvailable) return Promise.reject();
  return new Promise((resolve, reject) => {
    if (process.env.BUILD_PLATFORM === 'ios') {
      window.plugins.touchid.verifyFingerprintWithCustomPasswordFallbackAndEnterPasswordLabel(
        translate('Scan your fingerprint please'),
        translate('Enter PIN'),
        () => {
          resolve();
        }, reject
      );
    } else if (process.env.BUILD_PLATFORM === 'android') {
      window.Fingerprint.show({}, () => {
        resolve();
      }, reject);
    } else {
      reject();
    }
  });
}

module.exports = show;
