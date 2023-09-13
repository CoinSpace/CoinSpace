import {
  platformAuthenticatorIsAvailable,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';

let $btn;
let $message;

async function init() {
  $btn = document.getElementById('btn');
  $btn.innerHTML = 'OK';
  $message = document.getElementById('message');

  const params = new URLSearchParams(location.href.split('?')[1]);

  if (params.get('platform') === 'ios') {
    $message.innerHTML = getActionLabel(params.get('action'));
    $btn.onclick = () => run(params);
  } else {
    run(params);
  }
}

async function run(params) {
  $btn.onclick = () => close('coinspace://');
  let options = params.get('options');
  const action = params.get('action');
  try {
    if (!(await isSupported())) throw new Error('hardware_not_supported');
    if (options) options = JSON.parse(options);
    $message.innerHTML = getActionLabel(action);
    if (action === 'registration' && options) {
      await registration(options);
    } else if (action === 'authentication' && options) {
      await authentication(options);
    }
    $message.innerHTML = 'Success!';
  } catch (err) {
    $message.innerHTML = 'Error :(';
    console.error(err);
    close('coinspace://?window=fido&error=' + encodeURIComponent(JSON.stringify({
      name: err.name,
      message: err.message,
    })));
  }
}

async function isSupported() {
  try {
    return (await platformAuthenticatorIsAvailable());
  } catch (err) {
    return false;
  }
}

async function registration(options) {
  let registration = await startRegistration(options);
  registration = encodeURIComponent(JSON.stringify(registration));
  close('coinspace://?window=fido&data=' + registration);
}

async function authentication(options) {
  let authentication = await startAuthentication(options);
  authentication = encodeURIComponent(JSON.stringify(authentication));
  close('coinspace://?window=fido&data=' + authentication);
}

function getActionLabel(action) {
  if (action === 'registration') return 'Use your new Hardware Key';
  if (action === 'authentication') return 'Use your Hardware Key';
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
