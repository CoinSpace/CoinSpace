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

  window.open = (url, target, options) => {
    return cordova.InAppBrowser.open(url, '_system', options);
  };

  SafariViewController.isAvailable((available) => {
    if (!available) return;
    window.open = (url) => {
      SafariViewController.show(
        { url },
        (result) => {
          if (process.env.BUILD_PLATFORM === 'ios') {
            if (result.event === 'opened') return window.StatusBar.styleDefault();
            if (result.event === 'closed') return window.StatusBar.styleLightContent();
          }
        },
        () => {
          if (process.env.BUILD_PLATFORM === 'ios') return window.StatusBar.styleLightContent();
        });
    };
  });

  try {
    window.legacyTouchIdIsAvailable = await legacyTouchIdIsAvailable();
  } catch (e) {
    console.log('Oops!');
  }

  return import(
    /* webpackChunkName: 'loader' */
    '../app/loader'
  );
}

async function legacyTouchIdIsAvailable() {
  return new Promise((resolve) => {
    if (process.env.BUILD_PLATFORM === 'ios') {
      window.plugins.touchid.isAvailable(() => {
        resolve(true);
      }, () => {
        resolve(false);
      });
    } else if (process.env.BUILD_PLATFORM === 'android') {
      window.Fingerprint.isAvailable(() => {
        resolve(true);
      }, () => {
        resolve(false);
      });
    }
  }).catch(() => {
    return false;
  });
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
