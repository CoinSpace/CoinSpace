document.addEventListener('deviceready', onDeviceReady, false);
function onDeviceReady() {

  document.addEventListener('backbutton', function(e) {
    e.preventDefault();
  }, false);

  window.Zendesk.initialize(process.env.ZENDESK_APP_ID, process.env.ZENDESK_CLIENT_ID, process.env.ZENDESK_URL);

  return import(
    /* webpackChunkName: 'loader' */
    '../app/loader'
  );
}
