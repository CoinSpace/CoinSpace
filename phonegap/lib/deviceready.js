/* eslint-disable no-undef */
import Taptic from './Taptic.js';
import schemes from './schemes.js';

export default async function deviceready() {
  await new Promise((resolve) => {
    document.addEventListener('deviceready', resolve, false);
  });

  // fix: force fallback (cordova doesn't set Content-Type: application/wasm)
  if (window.WebAssembly) WebAssembly.instantiateStreaming = false;

  document.addEventListener('backbutton', (e) => {
    e.preventDefault();
    if (window.backButtonOff) return;
    if (window.backButtonModal) return window.backButtonModal();
    if (window.backButton) return window.backButton();
    window.navigator.app.exitApp();
  }, false);

  window.Zendesk.initialize(
    import.meta.env.VITE_ZENDESK_APP_ID,
    import.meta.env.VITE_ZENDESK_CLIENT_ID,
    import.meta.env.VITE_ZENDESK_URL
  );
  window.Zendesk.setAnonymousIdentity();

  const taptic = new Taptic();
  await taptic.init();
  window.taptic = taptic;

  window.qrScan = (callback) => {
    window.backButtonOff = true;
    cordova.plugins.barcodeScanner.scan(
      (result) => {
        setTimeout(() => { window.backButtonOff = false; }, 1000);
        if (result.text) {
          const address = result.text.split('?')[0].split(':').pop();
          callback(address);
        }
      },
      () => {
        setTimeout(() => { window.backButtonOff = false; }, 1000);
        navigator.notification.alert(
          'Access to the camera has been prohibited; please enable it in the Settings app to continue',
          () => {},
          'Coin Wallet'
        );
      },
      {
        showTorchButton: true,
      }
    );
  },

  navigator.clipboard.writeText = (text) => {
    cordova.plugins.clipboard.copy(text);
    return Promise.resolve();
  };
  navigator.clipboard.readText = () => {
    return new Promise((resolve) => {
      cordova.plugins.clipboard.paste(resolve);
    });
  };

  ThreeDeeTouch.onHomeIconPressed = ({ type }) => {
    const scheme = type.split('.').pop();
    const cryptoId = schemes[scheme];
    if (!cryptoId) return;
    const baseUrl = window.location.href.split('#')[0];
    window.location = `${baseUrl}#/${cryptoId}`;
  };

  window.open = (url, target, options) => {
    return cordova.InAppBrowser.open(url, '_system', options);
  };

  SafariViewController.isAvailable((available) => {
    if (!available) return;
    window.open = (url) => {
      SafariViewController.show({ url });
    };
  });

  if (import.meta.env.VITE_PLATFORM === 'ios') {
    window.StatusBar.styleDefault();
    window.StatusBar.show();
    window.StatusBar.overlaysWebView(false);
    window.StatusBar.overlaysWebView(true);
  }
}

window.handleOpenBip21 = (url = '') => {
  const scheme = url.split(':')[0];
  const cryptoId = schemes[scheme];
  if (!cryptoId) return;
  const baseUrl = window.location.href.split('#')[0];
  window.location = `${baseUrl}#/${cryptoId}/bip21/${encodeURIComponent(url)}`;
};
