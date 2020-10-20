'use strict';

const request = require('lib/request');
const LS = require('lib/wallet/localStorage');
const { startAttestation, startAssertion } = require('@simplewebauthn/browser');
const { urlRoot } = window;

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
  const options = await request({
    url: `${urlRoot}v2/crossplatform/attestation?id=${LS.getId()}`,
    method: 'get',
    seed: 'private',
  });
  let attestation;
  try {
    attestation = await startAttestation(options);
  } catch (err) {
    console.error(err);
    throw new Error('hardware_error');
  }
  await request({
    url: `${urlRoot}v2/crossplatform/attestation?id=${LS.getId()}`,
    method: 'post',
    data: attestation,
    seed: 'private',
  });
}

async function privateToken(options) {
  let assertion;
  try {
    assertion = await startAssertion(options);
  } catch (err) {
    console.error(err);
    throw new Error('hardware_error');
  }

  const res = await request({
    url: `${urlRoot}v2/token/private/crossplatform?id=${LS.getId()}`,
    method: 'post',
    data: assertion,
    seed: 'public',
  });

  return res.privateToken;
}

module.exports = {
  list,
  remove,
  add,
  privateToken,
};
