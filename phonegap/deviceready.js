'use strict';
/* eslint-disable no-undef */

document.addEventListener('deviceready', onDeviceReady, false);
async function onDeviceReady() {

  document.addEventListener('backbutton', (e) => {
    e.preventDefault();
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
        });
    };
  });

  return import(
    /* webpackChunkName: 'loader' */
    '../app/loader'
  );
}

window.onShortcutEvent = function(event) {
  const network = event.data.split('.').pop();
  if (['bitcoin', 'bitcoincash', 'ethereum', 'litecoin'].indexOf(network) === -1) return;

  const regex = /^network=/;
  const networkParam = window.location.search.substr(1).split('&').filter((e) => {
    return e.match(regex);
  })[0];
  const queryNetwork = networkParam ? networkParam.replace(regex, '') : null;
  if (network === queryNetwork) return;

  const baseUrl = window.location.href.split('?')[0];
  return window.location = baseUrl + '?network=' + network;
};
