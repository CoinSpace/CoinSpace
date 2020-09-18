'use strict';

const { translate } = require('lib/i18n');
const request = require('lib/request');
const LS = require('lib/wallet/localStorage');
const { PublicKeyCredential } = window;
const { urlRoot } = window;
const { startAttestation, startAssertion } = require('@simplewebauthn/browser');

let isAvailable = false;

async function init() {
  try {
    if (process.env.BUILD_TYPE === 'phonegap') {
      isAvailable = await new Promise((resolve) => {
        if (process.env.BUILD_PLATFORM === 'ios') {
          window.plugins.touchid.isAvailable(() => resolve(true), () => resolve(false));
        } else if (process.env.BUILD_PLATFORM === 'android') {
          window.Fingerprint.isAvailable(() => resolve(true), () => resolve(false));
        }
      });
    } else {
      isAvailable = PublicKeyCredential
        && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
        && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch (err) {
    isAvailable = false;
  }
}

async function enable(pin) {
  if (process.env.BUILD_TYPE === 'phonegap') {
    await phonegap();
    LS.setPin(pin);
  } else {
    const options = await request({
      url: `${urlRoot}v2/platform/attestation?id=${LS.getId()}`,
      method: 'get',
      seed: 'public',
    });
    const attestation = await startAttestation(options);
    await request({
      url: `${urlRoot}v2/platform/attestation?id=${LS.getId()}`,
      method: 'post',
      data: attestation,
      seed: 'public',
    });
    LS.setFidoTouchIdEnabled(true);
  }
}

function phonegap() {
  return new Promise((resolve, reject) => {
    const error = new Error('touch_id_error');
    if (process.env.BUILD_PLATFORM === 'ios') {
      window.plugins.touchid.verifyFingerprintWithCustomPasswordFallbackAndEnterPasswordLabel(
        translate('Scan your fingerprint please'),
        translate('Enter PIN'),
        () => resolve(),
        () => reject(error)
      );
    } else if (process.env.BUILD_PLATFORM === 'android') {
      window.Fingerprint.show({}, () => resolve(), () => reject(error));
    } else {
      reject(error);
    }
  });
}

async function fido() {
  const options = await request({
    url: `${urlRoot}v2/token/public/platform?id=${LS.getId()}`,
    method: 'get',
  });
  let assertion;
  try {
    assertion = await startAssertion(options);
  } catch (err) {
    throw new Error('touch_id_error');
  }
  const res = await request({
    url: `${urlRoot}v2/token/public/platform?id=${LS.getId()}`,
    method: 'post',
    data: assertion,
  });
  return res.publicToken;
}

function isEnabled() {
  if (!isAvailable) return false;
  if (process.env.BUILD_TYPE === 'phonegap') {
    return !!LS.getPin();
  }
  return !!LS.isFidoTouchIdEnabled();
}

module.exports = {
  init,
  enable,
  fido,
  phonegap,
  isAvailable: () => isAvailable,
  isEnabled,
};
