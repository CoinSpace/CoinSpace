'use strict';

const request = require('lib/request');
const LS = require('lib/wallet/localStorage');
const { startAttestation, startAssertion } = require('@simplewebauthn/browser');
const { showError } = require('widgets/modals/flash');
const windowExtra = require('lib/window-extra');
const { urlRoot, PublicKeyCredential } = window;
const urlFido = urlRoot.replace('/api/', '/fido/');
const notSupportedError = () => {
  showError({
    message: 'Hardware Keys are not supported by your device',
    href: 'https://coinapp.zendesk.com/hc/en-us',
    linkTextI18n: 'more info',
  });
};

async function list() {
  const keys = await request({
    url: `${urlRoot}v2/crossplatform?id=${LS.getId()}`,
    method: 'get',
    seed: 'public',
  });
  return keys;
}

async function remove(key) {
  await request({
    url: `${urlRoot}v2/crossplatform?id=${LS.getId()}`,
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
    url: `${urlRoot}v2/crossplatform/attestation?id=${LS.getId()}`,
    method: 'get',
    seed: 'private',
  });

  let attestation;
  try {
    if (process.env.BUILD_TYPE === 'web') {
      attestation = await startAttestation(options);
    } else {
      attestation = await windowExtra.open({
        url: `${urlFido}?action=attestation&options=${encodeURIComponent(JSON.stringify(options))}`,
        name: 'fido',
      });
    }
  } catch (err) {
    handleError(err);
  }

  await request({
    url: `${urlRoot}v2/crossplatform/attestation?id=${LS.getId()}`,
    method: 'post',
    data: attestation,
    seed: 'private',
  });
}

async function privateToken(options) {
  validate();
  if (!options) {
    options = await request({
      url: `${urlRoot}v2/token/private/crossplatform?id=${LS.getId()}`,
      method: 'get',
      seed: 'public',
    });
  }

  let assertion;
  try {
    if (process.env.BUILD_TYPE === 'web') {
      assertion = await startAssertion(options);
    } else {
      assertion = await windowExtra.open({
        url: `${urlFido}?action=assertion&options=${encodeURIComponent(JSON.stringify(options))}`,
        name: 'fido',
        width: 640,
        height: 720,
      });
    }
  } catch (err) {
    handleError(err);
  }

  const res = await request({
    url: `${urlRoot}v2/token/private/crossplatform?id=${LS.getId()}`,
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

module.exports = {
  list,
  remove,
  add,
  privateToken,
};
