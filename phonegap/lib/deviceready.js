/* eslint-disable no-undef */
import Taptic from './Taptic.js';

export default async function deviceready() {
  await new Promise((resolve) => {
    document.addEventListener('deviceready', resolve, false);
  });

  // fix: force fallback (cordova doesn't set Content-Type: application/wasm)
  if (window.WebAssembly) WebAssembly.instantiateStreaming = false;

  document.addEventListener('backbutton', (e) => {
    e.preventDefault();
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

  window.permissionDenied = async (message, buttonLabel, buttonLabels) => {
    const { canOpenSettings } = await new Promise((resolve) => window.QRScanner.getStatus(resolve));
    await new Promise((resolve) => {
      const title = 'Coin Wallet';
      if (canOpenSettings) {
        navigator.notification.confirm(
          message,
          (buttonIndex) => {
            if (buttonIndex === 2) window.QRScanner.openSettings();
            resolve();
          },
          title,
          buttonLabels
        );
      } else {
        navigator.notification.alert(
          message,
          resolve,
          title,
          buttonLabel
        );
      }
    });
  };

  navigator.clipboard.writeText = (text) => {
    cordova.plugins.clipboard.copy(text);
    return Promise.resolve();
  };
  navigator.clipboard.readText = () => {
    return new Promise((resolve) => {
      cordova.plugins.clipboard.paste(resolve);
    });
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

  window.handleOpenURL = function(url) {
    setTimeout(() => {
      if (url.startsWith('coinspace://')) {
        window.SafariViewController.hide();
        window.closeWindowExtra(url);
        return;
      }
      window.navigateHandler(`/bip21/${encodeURIComponent(url)}`);
    }, 1);
  };

  if (import.meta.env.VITE_PLATFORM === 'ios') {
    ThreeDeeTouch.onHomeIconPressed = ({ type }) => {
      const cryptoId = type.split('.').pop();
      window.navigateHandler(`/${cryptoId}`);
    };
    window.StatusBar.styleDefault();
    window.StatusBar.show();
  }
}
