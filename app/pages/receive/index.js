'use strict';

var Ractive = require('cs-ractive')
var emitter = require('cs-emitter')
var db = require('cs-db')
var CS = require('cs-wallet-js')
var showTooltip = require('cs-modal-tooltip')
var showQr = require('cs-modal-qr')
var geo = require('cs-geo')
var showError = require('cs-modal-flash').showError
var showSetDetails = require('cs-modal-set-details')
var fadeIn = require('cs-transitions/fade.js').fadeIn
var fadeOut = require('cs-transitions/fade.js').fadeOut
var getNetwork = require('cs-network')
var qrcode = require('cs-qrcode')

var WatchModule = require('cs-watch-module')

module.exports = function(el){
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract').template,
    data: {
      address: '',
      alias: '',
      qrVisible: false,
      btn_message: 'Turn Mecto on',
      connecting: false,
      broadcasting: false,
      isBitcoin: getNetwork() == 'bitcoin',
      mecto: false,
      isSocialSharing: window.buildType === 'phonegap' && window.plugins && window.plugins.socialsharing
    }
  })

  emitter.on('balance-ready', function(){
    ractive.set('address', getAddress())
    showQRcode()
  })

  emitter.on('wallet-ready', function(){
    ractive.set('address', getAddress())
  })

  emitter.on('update-balance', function() {
    ractive.set('address', getAddress())
  })

  emitter.on('db-ready', function(){
    db.get(function(err, doc){
      if(err) return console.error(err);

      ractive.set('alias', doc.userInfo.alias)
      if(doc.userInfo.firstName || ractive.get('isBitcoin')){
        ractive.set('mecto', true)
      }
    })
  })

  emitter.on('details-updated', function(details){
    ractive.set('alias', details.alias)
    if(details.firstName || ractive.get('isBitcoin')){
      ractive.set('mecto', true)
    }
  })

  emitter.on('turn-on-mecto-watch', function() {
    console.log('on turn on mecto')
    
    db.get(function(error, doc) {
      if (error) {
        console.log('error mecto: ' + error)
      } else {
        if (doc.userInfo.firstName) {
          mectoOn()
        } else {
          console.log('firstName not setted: ' + doc.userInfo.firstName)
          var response = {}
          response.command = 'mectoError'
          response.errorString = 'User name not setted. Please set user name at iPhone app.'
          WatchModule.sendMessage(response, 'comandAnswerQueue')
        }
      }
    })
  })
  
  emitter.on('getMectoStatus', function() {
    if (ractive.get('broadcasting')) {
      sendMectoStatus('on')
    } else {
      sendMectoStatus('off')
    }
  })
  
  emitter.on('turn-off-mecto-watch', function() {
    console.log('on turn off mecto')
    mectoOff()
  })

  ractive.on('toggle-broadcast', function(){
    if(ractive.get('connecting')) return;

    if(ractive.get('broadcasting')) {
      mectoOff()
      sendMectoStatus('off')
    } else {
      showSetDetails(function(err){
        if (err) {
          sendMectoStatus('off')
          return showError({message: 'Could not save your details'})
        }
        mectoOn()
        sendMectoStatus('on')
      })
    }
  })

  function showQRcode(){
      if(ractive.get('isSocialSharing')){
          var canvas = document.getElementById("qr_canvas")
          while (canvas.hasChildNodes()) {
              canvas.removeChild(canvas.firstChild)
          }
          var qr = qrcode(getNetwork() + ':' + getAddress())
          canvas.appendChild(qr)
      }
  }

  function mectoOff(){
    ractive.set('broadcasting', false)
    ractive.set('btn_message', 'Turn Mecto on')
    geo.remove(true)
  }

  function mectoOn(){
    ractive.set('connecting', true)
    ractive.set('btn_message', 'Checking your location')
    geo.save(function(err){
      if(err) {
        console.log('error on mecto = ' + err)
        var response = {}
        response.command = 'mectoError'
        response.errorString = err
        WatchModule.sendMessage(response, 'comandAnswerQueue')
        return handleMectoError(err)
      } 
      ractive.set('connecting', false)
      ractive.set('broadcasting', true)
      ractive.set('btn_message', 'Turn Mecto off')
    })
  }

  window.addEventListener('beforeunload', removeGeoData)

  function removeGeoData() {
    geo.remove(true)
  }

  ractive.on('teardown', function(){
    window.removeEventListener('beforeunload', removeGeoData)
  }, false)

  ractive.on('show-qr', function(){
      if(ractive.get('isSocialSharing')){
          window.plugins.socialsharing.share(ractive.get('address'))
      } else {
          showQr({
              address: ractive.get('address'),
              alias: ractive.get('alias')
          })
      }
  })

  ractive.on('help-alias', function() {
    showTooltip({
      message: 'Allow for payments with OpenAlias addresses. Supported wallets only.'
    })
  })

  ractive.on('help-mecto', function() {
    showTooltip({
      message: 'Mecto lets you broadcast your wallet address to other nearby Coin Space users by comparing GPS data. This data is deleted once you turn Mecto off.'
    })
  })

  function getAddress(){
    return CS.getWallet().getNextAddress()
  }

  function handleMectoError(err) {
    console.error(err)

    var data = {
      title: 'Uh Oh...',
      message: "We could not connect you to Mecto, please check your internet connection."
    }

    showError(data)
    ractive.set('connecting', false)
    ractive.set('broadcasting', false)
    ractive.set('btn_message', 'Turn Mecto on')
  }
  
  function sendMectoStatus(mectoStatus) {
    if (window.buildPlatform === 'ios') {
        var response = {}
        response.command = 'mectoStatus'
        response.status = mectoStatus
        WatchModule.sendMessage(response, 'comandAnswerQueue')
      } else {
        console.log('not ios platform')
      }

  }

  return ractive
}
