document.addEventListener('deviceready', onDeviceReady, false);
function onDeviceReady() {

  document.addEventListener('backbutton', function(e) {
    e.preventDefault();
    window.navigator.app.exitApp();
  }, false);

  window.Zendesk.initialize(process.env.ZENDESK_APP_ID, process.env.ZENDESK_CLIENT_ID, process.env.ZENDESK_URL);

  if (window.shortcutItem) window.shortcutItem.initialize();

  window.open = function(url, target, options) {
    return cordova.InAppBrowser.open(url, '_system', options);
  }

  // fix ios (check in cordova-ios 6.1.0)
  window.StatusBar.styleDefault();
  StatusBar.overlaysWebView(false);
  StatusBar.overlaysWebView(true);

  return import(
    /* webpackChunkName: 'loader' */
    '../app/loader'
  );
}

window.onShortcutEvent = function(event) {
  var network = event.data.split('.').pop();
  if (['bitcoin', 'bitcoincash', 'ethereum', 'litecoin'].indexOf(network) === -1) return;

  var regex = /^network=/;
  var networkParam = window.location.search.substr(1).split('&').filter(function(e) {
    return e.match(regex);
  })[0];
  var queryNetwork = networkParam ? networkParam.replace(regex, '') : null;
  if (network === queryNetwork) return;

  var baseUrl = window.location.href.split('?')[0];
  return window.location = baseUrl + '?network=' + network;
};
