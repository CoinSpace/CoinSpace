'use strict';

if (process.env.BUILD_TYPE === 'web') {
  window.urlRoot = window.origin + '/api/';
} else {
  window.urlRoot = process.env.SITE_URL;
}

window.initCSApp = async function() {
  const ticker = require('lib/ticker-api');
  const emitter = require('lib/emitter');
  const LS = require('lib/wallet/localStorage');
  const FastClick = require('fastclick');
  const initFrame = require('widgets/frame');
  const initAuth = require('pages/auth');
  const initGeoOverlay = require('widgets/geo-overlay');
  const { getToken, setToken, getTokenNetwork } = require('lib/token');
  const denomination = require('lib/denomination');
  const moonpay = require('lib/moonpay');
  const touchId = require('lib/touch-id');
  const { showError } = require('widgets/modals/flash');
  const showTouchIdSetup = require('widgets/touch-id-setup');

  const { fadeIn } = require('lib/transitions/fade.js');

  const appEl = document.getElementById('app');
  const htmlEl = document.documentElement;

  if (process.env.BUILD_PLATFORM === 'ios') {
    window.StatusBar.styleDefault();
    window.StatusBar.show();
    window.StatusBar.overlaysWebView(false);
    window.StatusBar.overlaysWebView(true);
  }
  if (process.env.BUILD_TYPE === 'phonegap') navigator.splashscreen.hide();

  await touchId.init();

  const frame = initFrame(appEl);
  let auth = null;

  fixFastClick();
  FastClick.attach(document.body);

  initGeoOverlay(document.getElementById('geo-overlay'));
  auth = initAuth(document.getElementById('auth'));
  const authContentEl = document.getElementById('auth_frame');
  authContentEl.style.opacity = 0;
  fadeIn(authContentEl);
  auth.show();

  emitter.on('open-overlay', () => {
    appEl.classList.add('is_hidden');
    htmlEl.classList.add('prevent_scroll');
  });

  emitter.on('close-overlay', () => {
    appEl.classList.remove('is_hidden');
    htmlEl.classList.remove('prevent_scroll');
  });

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

  emitter.once('wallet-ready', (pin) => {
    window.scrollTo(0, 0);
    emitter.emit('wallet-unblock');
    if (process.env.BUILD_TYPE === 'phonegap') window.Zendesk.setAnonymousIdentity();
    updateExchangeRates();
    moonpay.init();

    if (pin && touchId.isAvailable()) {
      const touchIdSetupWidget = showTouchIdSetup({ append: true, pin });
      touchIdSetupWidget.on('close', () => auth.hide());
    } else {
      auth.hide();
    }

    frame.show();
  });

  emitter.on('wallet-error', (err) => {
    if (err && err.message === 'cs-node-error') {
      emitter.emit('wallet-block');
      showError({
        message: "Can't connect to :network node. Please try again later or choose another token.",
        interpolations: { network: getTokenNetwork() },
      });
    } else {
      console.error(err);
      setToken(getTokenNetwork()); // fix wrong tokens
      showError({ message: err.message });
    }
  });

  emitter.on('sync', () => {
    updateExchangeRates();
  });

  function updateExchangeRates() {
    ticker.getExchangeRates(denomination(getToken())).then((rates) => {
      emitter.emit('ticker', rates);
    }).catch(console.error);
  }

  function fixFastClick() {
    const originOnTouchStart = FastClick.prototype.onTouchStart;
    FastClick.prototype.onTouchStart = function(event) {
      const targetElement = this.getTargetElementFromEventTarget(event.target);
      if (targetElement.nodeName.toLowerCase() === 'select') {
        return false;
      }
      originOnTouchStart.apply(this, arguments);
    };
  }

  if (process.env.BUILD_TYPE === 'phonegap') {
    window.handleOpenURL = function(url) {
      // eslint-disable-next-line no-undef
      SafariViewController.hide();
      if (process.env.BUILD_PLATFORM === 'ios') window.StatusBar.styleLightContent();
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
