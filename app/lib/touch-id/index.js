import { translate } from 'lib/i18n';
import request from 'lib/request';
import LS from 'lib/wallet/localStorage';
const { PublicKeyCredential } = window;
import { startAttestation, startAssertion } from '@simplewebauthn/browser';

let isAvailable = false;

async function init() {
  try {
    if (process.env.BUILD_TYPE === 'phonegap') {
      isAvailable = await new Promise((resolve) => {
        window.Fingerprint.isAvailable(() => resolve(true), () => resolve(false));
      });
    } else if (process.env.BUILD_TYPE === 'electron') {
      isAvailable = false;
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
    await new Promise((resolve, reject) => {
      window.Fingerprint.registerBiometricSecret({
        description: process.env.BUILD_PLATFORM === 'ios' ? translate('Scan your fingerprint please') : '',
        secret: pin,
        invalidateOnEnrollment: true,
        fallbackButtonTitle: translate('Enter PIN'),
        disableBackup: false,
      }, resolve, reject);
    });
  } else {
    const options = await request({
      url: `${process.env.SITE_URL}api/v3/platform/attestation`,
      method: 'get',
      seed: 'private',
    });
    let attestation;
    try {
      attestation = await startAttestation(options);
    } catch (err) {
      handleError(err);
    }
    await request({
      url: `${process.env.SITE_URL}api/v3/platform/attestation`,
      method: 'post',
      data: attestation,
      seed: 'private',
    });
  }
  LS.setTouchIdEnabled(true);
}

async function disable() {
  if (process.env.BUILD_TYPE !== 'phonegap') {
    await request({
      url: `${process.env.SITE_URL}api/v3/platform`,
      method: 'delete',
      seed: 'private',
    });
  }
  LS.setTouchIdEnabled(false);
}

function phonegap() {
  return new Promise((resolve, reject) => {
    const error = new Error('touch_id_error');
    window.Fingerprint.loadBiometricSecret({
      description: process.env.BUILD_PLATFORM === 'ios' ? translate('Scan your fingerprint please') : '',
      fallbackButtonTitle: translate('Enter PIN'),
      disableBackup: false,
    }, (secret) => resolve(secret), () => reject(error));
  });
}

async function publicToken(widget) {
  const options = await request({
    url: `${process.env.SITE_URL}api/v3/token/public/platform`,
    method: 'get',
    id: true,
  });
  let assertion;
  try {
    assertion = await startAssertion(options);
  } catch (err) {
    handleError(err);
  }
  widget && widget.loading();
  const res = await request({
    url: `${process.env.SITE_URL}api/v3/token/public/platform`,
    method: 'post',
    data: assertion,
    id: true,
  });
  return res;
}

async function privateToken() {
  const options = await request({
    url: `${process.env.SITE_URL}api/v3/token/private/platform`,
    method: 'get',
    seed: 'public',
  });
  let assertion;
  try {
    assertion = await startAssertion(options);
  } catch (err) {
    handleError(err);
  }
  const res = await request({
    url: `${process.env.SITE_URL}api/v3/token/private/platform`,
    method: 'post',
    data: assertion,
    seed: 'public',
  });

  return res;
}

export function isEnabled() {
  if (!isAvailable) return false;
  return !!LS.isTouchIdEnabled();
}

function handleError(err) {
  if (!err.message.startsWith('The operation either timed out or was not allowed.')) {
    console.error(err);
  }
  throw new Error('touch_id_error');
}

export default {
  init,
  enable,
  disable,
  publicToken,
  privateToken,
  phonegap,
  isAvailable: () => isAvailable,
  isEnabled,
};
