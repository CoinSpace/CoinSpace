'use strict';

var Ractive = require('../auth')
var CS = require('lib/wallet')
var emitter = require('lib/emitter')
var validatePin = require('lib/pin-validator')
var showError = require('widgets/modals/flash').showError
var translate = require('lib/i18n').translate
var getLanguage = require('lib/i18n').getLanguage
var pincode = ''

module.exports = function(prevPage, data){
  data = data || {}
  var userExists = data.userExists

  var ractive = new Ractive({
    partials: {
      header: require('./header.ract'),
      content: require('./content.ract'),
      footer: require('./footer.ract')
    },
    data: {
      userExists: userExists,
      pin: '',
      boxes: [null, null, null, null],
      visible: function(number){
        return number != null
      }
    },
    oncomplete: function() {
      initFingerprintAuth().catch(function() {
        ractive.find('#setPin').focus();
      });
    }
  })

  ractive.on('focus-pin', function(){
    ractive.set('pinfocused', true)
  })

  ractive.on('blur-pin', function(){
    ractive.set('pinfocused', false)
  })

  function pinCode(pin) {
      return function(){
          var pinParts = pin.split('')
          var pinString = ''
          for(var i=0; i<pinParts.length; i++) {
              if((parseInt(pinParts[i]) || parseInt(pinParts[i]) === 0) && typeof parseInt(pinParts[i]) === 'number') {
                  pinString += pinParts[i]
              }
          }
          pincode = pinString
          return pincode
      }
  }

  ractive.observe('pin', function(){
    var pin = ractive.find('#setPin').value
    var p = pinCode(pin)
    var boxes = p().split('')

    if(boxes.length === 4) {
      ractive.find('#setPin').blur()
      ractive.fire('enter-pin')
    } else {
      setTimeout(function(){
        ractive.set('pin', pincode)
      }, 0)
    }

    setBoxes(boxes);
  })

  ractive.on('enter-pin', function(){

    setTimeout(function(){

      if(!validatePin(getPin())){
        emitter.emit('clear-pin')
        return showError({ message: 'PIN must be a 4-digit number' })
      }

      ractive.set('opening', true)

      if (userExists) {
        ractive.set('progress', 'Verifying PIN')
        if (CS.walletExists()) { return openWithPin() }
        return setPin();
      }
      ractive.set('progress', 'Setting PIN')
      ractive.set('userExists', true)
      setPin()

    }, 500)

  })

  emitter.on('clear-pin', function() {
    ractive.find('#setPin').value = ''
    ractive.set('pin', '')
    setBoxes([]);
  })

  ractive.on('clear-credentials', function(){
    CS.reset();
    CS.resetPin();
    location.reload();
  })

  ractive.on('back', function(){
    if(prevPage) prevPage(data)
  })

  function getPin(){
    var pin = pincode || ractive.get('pin')
    return pin ? pin.toString() : ''
  }

  function setBoxes(boxes) {
    for (var i = boxes.length; i < 4; i++) {
      boxes[i] = null
    }
    ractive.set('boxes', boxes);
  }

  function openWithPin(){
    CS.openWalletWithPin(getPin(), ractive.getTokenNetwork(),
                         ractive.onSyncDone, ractive.onTxSyncDone)
  }

  function setPin(){
    CS.setPin(getPin(), ractive.getTokenNetwork(),
              ractive.onSyncDone, ractive.onTxSyncDone)
  }

  function initFingerprintAuth() {
    return new Promise(function(resolve, reject) {
      if (process.env.BUILD_PLATFORM === 'ios') {
        window.plugins.touchid.isAvailable(function() {
          CS.setAvailableTouchId();
          var pin = CS.getPin();
          if (pin && CS.walletExists() && userExists) {
            window.plugins.touchid.verifyFingerprintWithCustomPasswordFallbackAndEnterPasswordLabel(
              translate('Scan your fingerprint please'),
              translate('Enter PIN'),
              function() {
                resolve();
                ractive.set('pin', pin)
                var boxes = pin.split('')
                setBoxes(boxes);
              }, reject
            )
          } else {
            reject();
          }
        }, reject)
      } else if (process.env.BUILD_PLATFORM === 'android') {
        var FingerprintAuth = window.FingerprintAuth;
        FingerprintAuth.isAvailable(function(result) {
          if (!result.isAvailable) return reject();
          CS.setAvailableTouchId();
          var pin = CS.getPin();
          if (pin && CS.walletExists() && userExists) {
            var config = {clientId: 'coinspace', locale: getLanguage()};
            FingerprintAuth.encrypt(config, function() {
              resolve();
              ractive.set('pin', pin)
              var boxes = pin.split('')
              setBoxes(boxes);
            }, reject);
          } else {
            reject();
          }
        }, reject);
      } else {
        reject();
      }
    });
  }

  return ractive
}

