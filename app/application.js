'use strict';

window.urlRoot = process.env.SITE_URL;
if (process.env.BUILD_TYPE !== 'phonegap' && process.env.BUILD_TYPE !== 'electron') {
  window.urlRoot = '/' + window.urlRoot.split('/').slice(3).join('/')
}

window.initCSApp = function() {
  var ticker = require('lib/ticker-api')
  var emitter = require('lib/emitter')
  var walletExists = require('lib/wallet').walletExists
  var FastClick = require('fastclick')
  var initFrame = require('widgets/frame')
  var initAuth = require('widgets/auth')
  var initGeoOverlay = require('widgets/geo-overlay')
  var getToken = require('lib/token').getToken;
  var denomination = require('lib/denomination');
  var moonpay = require('lib/moonpay');

  var fadeIn = require('lib/transitions/fade.js').fadeIn

  var appEl = document.getElementById('app')
  var htmlEl = document.documentElement

  if (process.env.BUILD_PLATFORM === 'ios') {
    window.StatusBar.styleDefault();
    window.StatusBar.show();
    window.StatusBar.overlaysWebView(false);
    window.StatusBar.overlaysWebView(true);
  }
  if (process.env.BUILD_TYPE === 'phonegap') navigator.splashscreen.hide();

  var frame = initFrame(appEl)
  var auth = null

  fixFastClick();
  FastClick.attach(document.body)

  initGeoOverlay(document.getElementById('geo-overlay'))

  auth = walletExists() ? initAuth.pin(null, { userExists: true }) : initAuth.choose()
  var authContentEl = document.getElementById('auth_content')
  authContentEl.style.opacity = 0;
  fadeIn(authContentEl)
  auth.show()

  emitter.on('open-overlay', function(){
    appEl.classList.add('is_hidden')
    htmlEl.classList.add('prevent_scroll')
  })

  emitter.on('close-overlay', function(){
    appEl.classList.remove('is_hidden')
    htmlEl.classList.remove('prevent_scroll')
  })

  emitter.once('wallet-ready', function() {
    if (process.env.BUILD_TYPE === 'phonegap') window.Zendesk.setAnonymousIdentity();
    if (process.env.BUILD_PLATFORM === 'ios') window.StatusBar.styleLightContent();
    updateExchangeRates();
    moonpay.init();
    auth.hide();
    frame.show();
  });

  emitter.on('sync', function() {
    updateExchangeRates();
  });

  function updateExchangeRates() {
    ticker.getExchangeRates(denomination(getToken())).then(function(rates) {
      emitter.emit('ticker', rates);
    }).catch(console.error);
  }

  function fixFastClick() {
    var originOnTouchStart = FastClick.prototype.onTouchStart;
    FastClick.prototype.onTouchStart = function(event) {
      var targetElement = this.getTargetElementFromEventTarget(event.target);
      if (targetElement.nodeName.toLowerCase() === 'select') {
        return false;
      }
      originOnTouchStart.apply(this, arguments);
    }
  }

  if (process.env.BUILD_TYPE === 'phonegap') {
    window.handleOpenURL = function(url) {
      SafariViewController.hide();
      if (process.env.BUILD_PLATFORM === 'ios') window.StatusBar.styleLightContent();
      setTimeout(function() {
        emitter.emit('handleOpenURL', url);
      }, 1);
    };
  }

  if (process.env.BUILD_TYPE === 'electron') {
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('handleOpenURL', (event, url) => {
      emitter.emit('handleOpenURL', url);
    });
  }
}
