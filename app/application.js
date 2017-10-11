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

  var WatchModule = require('lib/apple-watch')

  var appEl = document.getElementById('app')
  var htmlEl = document.documentElement
  var frame = initFrame(appEl)
  var auth = null
  fastclick.attach(document.body)

  initGeoOverlay(document.getElementById('geo-overlay'))

  WatchModule.initWatch('group.com.coinspace.wallet')


  if (window.FacebookAds) {
    var ad_units = {
      ios : {banner: '196605347445795_200305920409071'},
      android : {banner: '196605347445795_200306843742312'}
    }
    var position = window.FacebookAds.AD_POSITION.BOTTOM_CENTER;

    var adid = (/(android)/i.test(navigator.userAgent)) ? ad_units.android : ad_units.ios;
    window.FacebookAds.createBanner({
      adId: adid.banner,
      position: position,
      autoShow: true
    }, function() {
      window.FacebookAds.fixBanner = function() {
        window.FacebookAds.showBanner(position);
      }
    });
  }

  walletExists(function(exists){
    auth = exists ? initAuth.pin(null, { userExists: true }) : initAuth.choose()
    var authContentEl = document.getElementById('auth_content')
    authContentEl.style.opacity = 0;
    fadeIn(authContentEl)
    auth.show()
  })

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
