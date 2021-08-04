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
        if (process.env.BUILD_PLATFORM === 'ios') {
          window.plugins.touchid.isAvailable(() => resolve(true), () => resolve(false));
        } else if (process.env.BUILD_PLATFORM.startsWith('android')) {
          window.Fingerprint.isAvailable(() => resolve(true), () => resolve(false));
        }
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
    await phonegap();
    LS.setPin(pin);
  } else {
    const options = await request({
      url: `${process.env.SITE_URL}api/v2/platform/attestation`,
      method: 'get',
      seed: 'private',
    });
    let attestation;
    try {
      attestation = await startAttestation(options);
    } catch (err) {
      console.error(err);
      throw new Error('touch_id_error');
    }
    await request({
      url: `${process.env.SITE_URL}api/v2/platform/attestation`,
      method: 'post',
      data: attestation,
      seed: 'private',
    });
    LS.setFidoTouchIdEnabled(true);
  }
}

async function disable() {
  if (process.env.BUILD_TYPE === 'phonegap') {
    LS.setPin(false);
  } else {
    await request({
      url: `${process.env.SITE_URL}api/v2/platform`,
      method: 'delete',
      seed: 'private',
    });
    LS.setFidoTouchIdEnabled(false);
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
    } else if (process.env.BUILD_PLATFORM.startsWith('android')) {
      window.Fingerprint.show({}, () => resolve(), () => reject(error));
    } else {
      reject(error);
    }
  });
}

async function publicToken(widget) {
  const options = await request({
    url: `${process.env.SITE_URL}api/v2/token/public/platform`,
    method: 'get',
    id: true,
  });
  let assertion;
  try {
    assertion = await startAssertion(options);
  } catch (err) {
    console.error(err);
    throw new Error('touch_id_error');
  }
  widget && widget.loading();
  const res = await request({
    url: `${process.env.SITE_URL}api/v2/token/public/platform`,
    method: 'post',
    data: assertion,
    id: true,
  });
  return res;
}

async function privateToken() {
  const options = await request({
    url: `${process.env.SITE_URL}api/v2/token/private/platform`,
    method: 'get',
    seed: 'public',
  });
  let assertion;
  try {
    assertion = await startAssertion(options);
  } catch (err) {
    console.error(err);
    throw new Error('touch_id_error');
  }
  const res = await request({
    url: `${process.env.SITE_URL}api/v2/token/private/platform`,
    method: 'post',
    data: assertion,
    seed: 'public',
  });

  return res;
}

export function isEnabled() {
  if (!isAvailable) return false;
  if (process.env.BUILD_TYPE === 'phonegap') {
    return !!LS.getPin();
  }
  return !!LS.isFidoTouchIdEnabled();
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
