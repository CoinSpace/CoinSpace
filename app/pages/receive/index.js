'use strict';

var Ractive = require('lib/ractive')
var emitter = require('lib/emitter')
var db = require('lib/db')
var CS = require('lib/wallet')
var showTooltip = require('widgets/modal-tooltip')
var showQr = require('widgets/modal-qr')
var geo = require('lib/geo')
var showError = require('widgets/modal-flash').showError
var showSetDetails = require('widgets/modal-set-details')
var fadeIn = require('lib/transitions/fade.js').fadeIn
var fadeOut = require('lib/transitions/fade.js').fadeOut
var getNetwork = require('lib/network')
var qrcode = require('lib/qrcode')

var WatchModule = require('lib/apple-watch')

module.exports = function(el){
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      address: '',
      qrVisible: false,
      btn_message: 'Turn Mecto on',
      connecting: false,
      broadcasting: false,
      isSocialSharing: process.env.BUILD_TYPE === 'phonegap' && window.plugins && window.plugins.socialsharing
    }
  })

  emitter.on('wallet-ready', function(){
    ractive.set('address', getAddress())
    showQRcode()
  })

  emitter.on('update-balance', function() {
    ractive.set('address', getAddress())
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
        window.plugins.socialsharing.shareWithOptions({
          message: ractive.get('address')
        }, function() {
          if (window.FacebookAds && window.FacebookAds.fixBanner) {
            window.FacebookAds.fixBanner();
          }
        });
      } else {
        showQr({
          address: ractive.get('address')
        })
      }
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
    if (process.env.BUILD_PLATFORM === 'ios') {
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
