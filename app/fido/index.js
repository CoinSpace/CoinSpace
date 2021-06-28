import { startAttestation, startAssertion } from '@simplewebauthn/browser';
import querystring from 'querystring';
const { PublicKeyCredential } = window;
let $btn;
let $message;

async function init() {
  $btn = document.getElementById('btn');
  $btn.innerHTML = 'OK';
  $message = document.getElementById('message');

  const params = querystring.parse(location.href.split('?')[1]);

  if (params.buildPlatform === 'ios') {
    $message.innerHTML = getActionLabel(params.action);
    $btn.onclick = () => run(params);
  } else {
    run(params);
  }
}

async function run(params) {
  $btn.onclick = () => close('coinspace://');
  let { options } = params;
  const { action } = params;
  try {
    if (!PublicKeyCredential) throw new Error('hardware_not_supported');
    if (options) options = JSON.parse(options);
    $message.innerHTML = getActionLabel(action);
    if (action === 'attestation' && options) {
      await attestation(options);
    } else if (action === 'assertion' && options) {
      await assertion(options);
    }
    $message.innerHTML = 'Success!';
  } catch (err) {
    $message.innerHTML = 'Error :(';
    console.error(err);
    close('coinspace://?window=fido&error=' + encodeURIComponent(err.message));
  }
}

async function attestation(options) {
  let attestation = await startAttestation(options);
  attestation = encodeURIComponent(JSON.stringify(attestation));
  close('coinspace://?window=fido&data=' + attestation);
}

async function assertion(options) {
  let assertion = await startAssertion(options);
  assertion = encodeURIComponent(JSON.stringify(assertion));
  close('coinspace://?window=fido&data=' + assertion);
}

function getActionLabel(action) {
  if (action === 'attestation') return 'Use your new Hardware Key';
  if (action === 'assertion') return 'Use your Hardware Key';
  return 'Unknown action';
}

function close(url) {
  $btn.onclick = () => {
    window.location = url;
    // debug (web)
    // window.opener.handleOpenURL(url);
    // window.close();
    return false;
  };
  $btn.onclick();
}

init();
