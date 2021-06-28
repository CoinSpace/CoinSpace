import request from 'lib/request';
import { startAttestation, startAssertion } from '@simplewebauthn/browser';
import { showError } from 'widgets/modals/flash';
import windowExtra from 'lib/window-extra';
import { translate } from 'lib/i18n';
import querystring from 'querystring';
const { PublicKeyCredential } = window;
const notSupportedError = () => {
  showError({
    message: translate('Hardware Keys are not supported by your device'),
    href: 'https://coinapp.zendesk.com/hc/en-us/articles/360051635571',
    linkText: translate('more info'),
  });
};

async function list() {
  const keys = await request({
    url: `${process.env.SITE_URL}api/v2/crossplatform`,
    method: 'get',
    seed: 'public',
  });
  return keys;
}

async function remove(key) {
  await request({
    url: `${process.env.SITE_URL}api/v2/crossplatform`,
    method: 'delete',
    data: {
      credentialID: key.credentialID,
    },
    seed: 'private',
  });
}

async function add() {
  validate();
  const options = await request({
    url: `${process.env.SITE_URL}api/v2/crossplatform/attestation`,
    method: 'get',
    seed: 'private',
  });

  const params = {
    action: 'attestation',
    options: JSON.stringify(options),
    buildPlatform: process.env.BUILD_PLATFORM,
  };

  let attestation;
  try {
    if (process.env.BUILD_TYPE === 'web') {
      attestation = await startAttestation(options);
    } else {
      attestation = await windowExtra.open({
        url: `${process.env.SITE_URL}fido/?${querystring.stringify(params)}`,
        name: 'fido',
        target: process.env.BUILD_TYPE === 'electron' ? '_modal' : '_system',
      });
    }
  } catch (err) {
    handleError(err);
  }

  await request({
    url: `${process.env.SITE_URL}api/v2/crossplatform/attestation`,
    method: 'post',
    data: attestation,
    seed: 'private',
  });
}

async function privateToken(options) {
  validate();
  if (!options) {
    options = await request({
      url: `${process.env.SITE_URL}api/v2/token/private/crossplatform`,
      method: 'get',
      seed: 'public',
    });
  }

  const params = {
    action: 'assertion',
    options: JSON.stringify(options),
    buildPlatform: process.env.BUILD_PLATFORM,
  };

  let assertion;
  try {
    if (process.env.BUILD_TYPE === 'web') {
      assertion = await startAssertion(options);
    } else {
      assertion = await windowExtra.open({
        url: `${process.env.SITE_URL}fido/?${querystring.stringify(params)}`,
        name: 'fido',
        target: process.env.BUILD_TYPE === 'electron' ? '_modal' : '_system',
      });
    }
  } catch (err) {
    handleError(err);
  }

  const res = await request({
    url: `${process.env.SITE_URL}api/v2/token/private/crossplatform`,
    method: 'post',
    data: assertion,
    seed: 'public',
  });

  return res.privateToken;
}

function validate() {
  if (process.env.BUILD_TYPE === 'web' && !PublicKeyCredential) {
    notSupportedError();
    throw new Error('hardware_error');
  }
}

function handleError(err) {
  if (err.message === 'hardware_not_supported') {
    notSupportedError();
  } else {
    console.error(err);
  }
  throw new Error('hardware_error');
}

export default {
  list,
  remove,
  add,
  privateToken,
};
