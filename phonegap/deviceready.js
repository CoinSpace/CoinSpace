document.addEventListener('deviceready', onDeviceReady, false);
function onDeviceReady(){
  var script = document.createElement('script');
  script.src = 'assets/js/loader.js';
  document.body.appendChild(script);

  document.addEventListener('backbutton', function(e) {
    e.preventDefault();
  }, false);
}