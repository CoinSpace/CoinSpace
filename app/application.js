'use strict';
window.initCSApp = function() {
  var Ticker = require('cs-ticker-api').BitcoinAverage
  var emitter = require('cs-emitter')
  var walletExists = require('cs-wallet-js').walletExists
  var fastclick = require('fastclick')
  var initFrame = require('cs-frame')
  var initAuth = require('cs-auth')
  var initGeoOverlay = require('cs-geo-overlay')
  var $ = require('browserify-zepto')
  var getNetwork = require('cs-network')
  var fadeIn = require('cs-transitions/fade.js').fadeIn

  var appEl = document.getElementById('app')
  var frame = initFrame(appEl)
  var auth = null
  var _html = $('html')
  var _app = $(appEl)
  fastclick(document.body)

  initGeoOverlay(document.getElementById('geo-overlay'))

  walletExists(function(exists){
    auth = exists ? initAuth.pin(null, { userExists: true }) : initAuth.choose()
    var authContentEl = document.getElementById('auth_content')
    authContentEl.style.opacity = 0;
    fadeIn(authContentEl)
    auth.show()
  })

  emitter.on('open-overlay', function(){
    _app.addClass('is_hidden')
    _html.addClass('prevent_scroll')
  })

  emitter.on('close-overlay', function(){
    _app.removeClass('is_hidden')
    _html.removeClass('prevent_scroll')
  })

  emitter.on('balance-ready', function(){
    auth.hide()
    frame.show()
  })

  function updateExchangeRates(){
    var tickerUpdateInterval = 1000 * 60 * 2
    var ticker = new Ticker(getNetwork())

    ticker.getExchangeRates(function(err, rates){
      if(rates) emitter.emit('ticker', rates)
      window.setTimeout(updateExchangeRates, tickerUpdateInterval)
    })
  }

  updateExchangeRates()
}
