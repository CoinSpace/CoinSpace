'use strict';

const { startAttestation, startAssertion } = require('@simplewebauthn/browser');

function init() {

  const action = getParam('action');
  const options = getParam('options');

  if (action === 'platformAttestation' && options) {
    const btn = document.getElementById('enable-btn');
    btn.style = '';
  } else if (action === 'platformAssertion' && options) {
    const btn = document.getElementById('use-btn');
    btn.style = '';
  }
}

init();

window.enableTouchId = async function() {
  let options = getParam('options');
  options = JSON.parse(decodeURIComponent(options));

  console.log('options', options);
  let attestation = await startAttestation(options);
  console.log('attestation', attestation);

  attestation = encodeURIComponent(JSON.stringify(attestation));

  window.location = 'coinspace://?window=fido&data=' + attestation;
  // window.opener.handleOpenURL('coinspace://?window=fido&data=' + attestation);
  // window.close();
};

window.useTouchId = async function() {
  let options = getParam('options');
  options = JSON.parse(decodeURIComponent(options));

  console.log('options', options);
  let assertion = await startAssertion(options);
  console.log('assertion', assertion);

  assertion = encodeURIComponent(JSON.stringify(assertion));

  window.location = 'coinspace://?window=fido&data=' + assertion;
  // window.opener.handleOpenURL('coinspace://?window=fido&data=' + assertion);
  // window.close();
};

function getParam(name) {
  const reg = new RegExp(name + '=([^&]+)');
  const matchAction = location.href.match(reg);
  return matchAction && matchAction[1];
}



