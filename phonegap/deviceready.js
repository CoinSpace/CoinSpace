/* eslint-disable no-undef */

export default async function deviceready() {
  await new Promise((resolve) => {
    document.addEventListener('deviceready', resolve, false);
  });

  // fix: force fallback (cordova doesn't set Content-Type: application/wasm)
  if (window.WebAssembly) WebAssembly.instantiateStreaming = false;

  document.addEventListener('backbutton', (e) => {
    e.preventDefault();
    if (window.backButtonOff) return;
    window.navigator.app.exitApp();
  }, false);

  window.Zendesk.initialize(
    import.meta.env.VITE_ZENDESK_APP_ID,
    import.meta.env.VITE_ZENDESK_CLIENT_ID,
    import.meta.env.VITE_ZENDESK_URL
  );

  // TODO
  // ThreeDeeTouch.onHomeIconPressed = function({ type }) {
  //   const platform = type.split('.').pop();
  //   if (!['bitcoin', 'dogecoin', 'ethereum', 'litecoin'].includes(platform)) return;
  //   const baseUrl = window.location.href.split('?')[0];
  //   const cryptoId = `${platform}@${platform}`;
  //   return window.location = `${baseUrl}?crypto=${cryptoId}`;
  // };
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

// TODO
// window.handleOpenURL = function(url) {
//   const cryptoId = bip21.getSchemeCryptoId(url);
//   if (!cryptoId) return;
//   window.localStorage.setItem('_cs_bip21', url);
//   const baseUrl = window.location.href.split('?')[0];
//   window.location = `${baseUrl}?crypto=${cryptoId}`;
// };
