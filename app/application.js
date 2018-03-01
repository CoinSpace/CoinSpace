'use strict';

window.initCSApp = function() {
  var Ticker = require('lib/ticker-api').BitcoinAverage
  var emitter = require('lib/emitter')
  var walletExists = require('lib/wallet').walletExists
  var fastclick = require('fastclick')
  var initFrame = require('widgets/frame')
  var initAuth = require('widgets/auth')
  var initGeoOverlay = require('widgets/geo-overlay')
  var getNetwork = require('lib/network')
  var fadeIn = require('lib/transitions/fade.js').fadeIn
  var ads = require('lib/ads');

  var WatchModule = require('lib/apple-watch')

  var appEl = document.getElementById('app')
  var htmlEl = document.documentElement
  var frame = initFrame(appEl)
  var auth = null
  fastclick.attach(document.body)

  initGeoOverlay(document.getElementById('geo-overlay'))

  WatchModule.initWatch('group.com.coinspace.wallet')

  if (process.env.BUILD_TYPE === 'phonegap') {
    ads.init();
    if (window.store) {
      window.store.refresh();
    }
  }

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

  emitter.on('wallet-ready', function(){
    auth.hide()
    frame.show()
  })

  function updateExchangeRates(){
    var tickerUpdateInterval = 1000 * 60 * 10
    var ticker = new Ticker(getNetwork())

    ticker.getExchangeRates(function(err, rates){
      if (rates) {
        if (process.env.BUILD_PLATFORM === 'ios') {
          var message = {}
          message.command = 'currencyMessage'
          message.currency = rates;

          WatchModule.setRates(rates)

          WatchModule.sendMessage(message, 'comandAnswerQueue')
        }
        emitter.emit('ticker', rates);
      }
      window.setTimeout(updateExchangeRates, tickerUpdateInterval)
    })
  }

  updateExchangeRates()
}
