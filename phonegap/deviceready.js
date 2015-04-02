document.addEventListener('deviceready', onDeviceReady, false);
function onDeviceReady(){
  var script = document.createElement('script');
  script.src = 'assets/js/loader.js';
  document.body.appendChild(script);
}