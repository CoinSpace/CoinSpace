'use strict';

const { startAttestation, startAssertion } = require('@simplewebauthn/browser');
const { PublicKeyCredential } = window;
const BUILD_TYPE = 'phonegap';

async function init() {
  const action = getParam('action');
  let options = getParam('options');
  try {
    if (!PublicKeyCredential) throw new Error('hardware_not_supported');
    options = JSON.parse(decodeURIComponent(options));
    if (action === 'attestation' && options) {
      await attestation(options);
    } else if (action === 'assertion' && options) {
      await assertion(options);
    }
  } catch (err) {
    console.error(err);
    close('coinspace://?window=fido&error=' + encodeURIComponent(err.message));
  }
}

async function attestation(options) {
  let attestation = await startAttestation(options);
  console.log('attestation', attestation);
  attestation = encodeURIComponent(JSON.stringify(attestation));
  close('coinspace://?window=fido&data=' + attestation);
}

async function assertion(options) {
  let assertion = await startAssertion(options);
  assertion = encodeURIComponent(JSON.stringify(assertion));
  close('coinspace://?window=fido&data=' + assertion);
}

function close(url) {
  if (BUILD_TYPE === 'phonegap') {
    window.location = url;
  } else if (BUILD_TYPE === 'web') {
    window.opener.handleOpenURL(url);
    window.close();
  }
}

function getParam(name) {
  const reg = new RegExp(name + '=([^&]+)');
  const matchAction = location.href.match(reg);
  return matchAction && matchAction[1];
}

init();
