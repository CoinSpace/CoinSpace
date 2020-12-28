'use strict';

if (process.env.BUILD_PLATFORM === 'tor') {
  window.urlRoot = `http://${process.env.DOMAIN_ONION}/`;
} else {
  window.urlRoot = process.env.SITE_URL;
}

window.initCSApp = async function() {
  const emitter = require('lib/emitter');
  const LS = require('lib/wallet/localStorage');
  const initFrame = require('widgets/frame');
  const initAuth = require('pages/auth');
  const touchId = require('lib/touch-id');
  const updater = require('lib/updater');
  const { showError } = require('widgets/modals/flash');
  const showTouchIdSetup = require('widgets/touch-id-setup');

  const { fadeIn } = require('lib/transitions/fade.js');

  const appEl = document.getElementById('app');

  if (process.env.BUILD_PLATFORM === 'ios') {
    window.StatusBar.setStyle('default');
    window.StatusBar.show();
    window.StatusBar.overlaysWebView(false);
    window.StatusBar.overlaysWebView(true);
  }
  if (process.env.BUILD_TYPE === 'phonegap') navigator.splashscreen.hide();

  await touchId.init();
  updater.init();

  const auth = initAuth(document.getElementById('auth'));
  const authContentEl = document.getElementById('auth_frame');
  authContentEl.style.opacity = 0;
  fadeIn(authContentEl);
  auth.show();

  emitter.on('auth-error', (err) => {
    if (err.status === 410 || err.status === 404) {
      LS.reset();
      return location.reload();
    }
    if (err.status === 401) return;
    // Deprecated start
    if (err.message === 'user_deleted') {
      LS.reset();
      return location.reload();
    }
    if (err.message === 'auth_failed') return;
    // Deprecated end
    console.error(err);
    return showError({ message: err.message });
  });

  emitter.once('wallet-ready', ({ pin, err } ) => {
    window.scrollTo(0, 0);
    if (process.env.BUILD_TYPE === 'phonegap') window.Zendesk.setAnonymousIdentity();
    const frame = initFrame(appEl, err);
    if (pin && touchId.isAvailable()) {
      const touchIdSetupWidget = showTouchIdSetup({ append: true, pin });
      touchIdSetupWidget.on('close', () => {
        auth.hide();
        frame.show();
      });
    } else {
      auth.hide();
      frame.show();
    }
  });

  window.safeOpen = function(...args) {
    const win = window.open(...args);
    if (win) {
      win.opener = null;
    }
    return false;
  };

  if (process.env.BUILD_TYPE === 'phonegap') {
    window.handleOpenURL = function(url) {
      const { SafariViewController } = window;
      SafariViewController.hide();
      if (process.env.BUILD_PLATFORM === 'ios') window.StatusBar.setStyle(SafariViewController.statusBarStyle);
      setTimeout(() => {
        emitter.emit('handleOpenURL', url);
      }, 1);
    };
  }

  if (process.env.BUILD_TYPE === 'web') {
    window.handleOpenURL = function(url) {
      setTimeout(() => {
        emitter.emit('handleOpenURL', url);
      }, 1);
    };
  }

  if (process.env.BUILD_TYPE === 'electron') {
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('handleOpenURL', (event, url) => {
      emitter.emit('handleOpenURL', url);
    });
  }
};
