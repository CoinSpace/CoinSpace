import { startAttestation, startAssertion } from '@simplewebauthn/browser';
const { PublicKeyCredential } = window;
let $backBtn;

import querystring from 'querystring';

async function init() {
  $backBtn = document.getElementById('back-btn');
  $backBtn.onclick = () => close('coinspace://');

  const params = querystring.parse(location.href.split('?')[1]);
  const { action } = params;
  let { options } = params;
  const $message = document.getElementById('message');
  try {
    if (!PublicKeyCredential) throw new Error('hardware_not_supported');
    if (options) options = JSON.parse(options);
    if (action === 'attestation' && options) {
      $message.innerHTML = 'Use your new Hardware Key';
      await attestation(options);
    } else if (action === 'assertion' && options) {
      $message.innerHTML = 'Use your Hardware Key';
      await assertion(options);
    }
    $message.innerHTML = 'Success!';
  } catch (err) {
    $message.innerHTML = 'Error :(';
    console.error(err);
    close('coinspace://?window=fido&error=' + encodeURIComponent(err.message));
  }
  $backBtn.innerHTML = 'OK';
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

function close(url) {
  $backBtn.onclick = () => {
    window.location = url;
    // debug (web)
    // window.opener.handleOpenURL(url);
    // window.close();
    return false;
  };
  $backBtn.onclick();
}

init();
