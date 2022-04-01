'use strict';
/* eslint-disable no-undef */

const bip21 = require('lib/bip21');

document.addEventListener('deviceready', onDeviceReady, false);
async function onDeviceReady() {

  WebAssembly.instantiateStreaming = false; // fix: force fallback (cordova doesn't set Content-Type: application/wasm)

  document.addEventListener('backbutton', (e) => {
    e.preventDefault();
    if (window.backButtonOff) return;
    window.navigator.app.exitApp();
  }, false);

  window.Zendesk.initialize(process.env.ZENDESK_APP_ID, process.env.ZENDESK_CLIENT_ID, process.env.ZENDESK_URL);

  if (window.shortcutItem) window.shortcutItem.initialize();

  if (process.env.BUILD_PLATFORM === 'ios') {
    window.StatusBar.setStyle = (style) => {
      window.StatusBar.style = style;
      if (style === 'default') return window.StatusBar.styleDefault();
      if (style === 'lightContent') return window.StatusBar.styleLightContent();
    };
  }

  window.open = (url, target, options) => {
    return cordova.InAppBrowser.open(url, '_system', options);
  };

  SafariViewController.isAvailable((available) => {
    if (!available) return;
    window.open = (url) => {
      if (process.env.BUILD_PLATFORM === 'ios') {
        SafariViewController.statusBarStyle = window.StatusBar.style;
      }
      SafariViewController.show(
        { url },
        (result) => {
          if (process.env.BUILD_PLATFORM === 'ios') {
            if (result.event === 'opened') return window.StatusBar.setStyle('default');
            if (result.event === 'closed') {
              return window.StatusBar.setStyle(SafariViewController.statusBarStyle);
            }
          }
        },
        () => {
          return window.StatusBar.setStyle(SafariViewController.statusBarStyle);
        }
      );
      return {};
    };
  });

  return import(
    /* webpackChunkName: 'loader' */
    '../app/loader'
  );
}

window.onShortcutEvent = function(event) {
  const platform = event.data.split('.').pop();
  if (!['bitcoin', 'dogecoin', 'ethereum', 'litecoin'].includes(platform)) return;
  const baseUrl = window.location.href.split('?')[0];
  const cryptoId = `${platform}@${platform}`;
  return window.location = `${baseUrl}?crypto=${cryptoId}`;
};

window.handleOpenURL = function(url) {
  const cryptoId = bip21.getSchemeCryptoId(url);
  if (!cryptoId) return;
  window.localStorage.setItem('_cs_bip21', url);
  const baseUrl = window.location.href.split('?')[0];
  window.location = `${baseUrl}?crypto=${cryptoId}`;
};
