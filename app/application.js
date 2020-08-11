'use strict';

window.urlRoot = process.env.SITE_URL;
if (process.env.BUILD_TYPE !== 'phonegap' && process.env.BUILD_TYPE !== 'electron') {
  window.urlRoot = '/' + window.urlRoot.split('/').slice(3).join('/');
}

window.initCSApp = function() {
  const ticker = require('lib/ticker-api');
  const emitter = require('lib/emitter');
  const { walletExists } = require('lib/wallet');
  const FastClick = require('fastclick');
  const initFrame = require('widgets/frame');
  const initAuth = require('widgets/auth');
  const initGeoOverlay = require('widgets/geo-overlay');
  const { getToken } = require('lib/token');
  const denomination = require('lib/denomination');
  const moonpay = require('lib/moonpay');

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

  const frame = initFrame(appEl);
  let auth = null;

  fixFastClick();
  FastClick.attach(document.body);

  initGeoOverlay(document.getElementById('geo-overlay'));

  auth = walletExists() ? initAuth.pin(null, { userExists: true }) : initAuth.choose();
  const authContentEl = document.getElementById('auth_content');
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

  emitter.once('wallet-ready', () => {
    if (process.env.BUILD_TYPE === 'phonegap') window.Zendesk.setAnonymousIdentity();
    if (process.env.BUILD_PLATFORM === 'ios') window.StatusBar.styleLightContent();
    updateExchangeRates();
    moonpay.init();
    auth.hide();
    frame.show();
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

  if (process.env.BUILD_TYPE === 'electron') {
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('handleOpenURL', (event, url) => {
      emitter.emit('handleOpenURL', url);
    });
  }
};
