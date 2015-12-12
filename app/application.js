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
  var sync = require('cs-wallet-js').sync
  
  var CS = require('cs-wallet-js')
  var getNetwork = require('cs-network')
  var yaqrcode = require('yaqrcode')

  var appEl = document.getElementById('app')
  var frame = initFrame(appEl)
  var auth = null
  var _html = $('html')
  var _app = $(appEl)
  fastclick(document.body)

  initGeoOverlay(document.getElementById('geo-overlay'))

  if (window.buildPlatform === 'ios') {
    applewatch.init(onSuccessInitAppleWatch, onErrorInitAppleWatch, 'group.com.coinspace.wallet.dev')
  
    applewatch.addListener('requestCommandQueue', function(message) {
      
      console.log('receive command: ' + message)
      
      if (message === 'updateBalance') {
        console.log('receive request balanceUdpate');
        sync(function(err, txs) {
          if(err) return showError(err)
          emitter.emit('update-balance')
        })
      } else if (message === 'showQrCode') {
        console.log('receive request qr code')
        var address = CS.getWallet().getNextAddress()
        var qr = yaqrcode(getNetwork() + ':' + address)
    
        var response = {}
        response.command = 'qrMessage'
        response.qr = qr
        response.address = address
    
        applewatch.sendMessage(response, 'comandAnswerQueue')
      } else if (message == 'turnMectoOff') {
        console.log('turn off mecto')
        emitter.emit('turn-off-mecto-watch')
      } else if (message === 'turnMectoOn') {
        console.log('turn on mnecto')
        emitter.emit('turn-on-mecto-watch')
      } else if (message === 'getMectoStatus') {
        console.log('on getMectoStatus')
        emitter.emit('getMectoStatus')
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
      if (rates) {
        if (window.buildPlatform === 'ios') {
          var respone = {}
          respone.command = 'currencyMessage'
          respone.currency = rates;
          applewatch.sendMessage(respone, 'comandAnswerQueue');
        }
        emitter.emit('ticker', rates);
      }
      window.setTimeout(updateExchangeRates, tickerUpdateInterval)
    })
  }
  
  function onSuccessInitAppleWatch(appGroupId) {
    console.log('success init with ' + appGroupId);
  }
  
  function onErrorInitAppleWatch() {
    console.log('failed init apple watch module');
  }
  
  function onSuccessUserDefaults() {
    console.log('success on user defaults')
  }
  
  function onErrorUserDefaults() {
    console.log('error on user defaults')
  }

  updateExchangeRates()
}
