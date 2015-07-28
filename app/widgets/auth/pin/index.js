'use strict';

var Ractive = require('../auth')
var CS = require('cs-wallet-js')
var emitter = require('cs-emitter')
var validatePin = require('cs-pin-validator')
var showError = require('cs-modal-flash').showError

module.exports = function(prevPage, data){
  data = data || {}
  var userExists = data.userExists
  var phone = data.phone

  var ractive = new Ractive({
    partials: {
      header: require('./header.ract').template,
      content: require('./content.ract').template,
      footer: require('./footer.ract').template
    },
    data: {
      userExists: userExists,
      pin: '',
      boxes: [null, null, null, null],
      visible: function(number){
        return number != null
      }
    }
  })

  ractive.on('focus-pin', function(){
    ractive.set('pinfocused', true)
  })

  ractive.on('blur-pin', function(){
    ractive.set('pinfocused', false)
  })

  ractive.observe('pin', function(){
    var pin = ractive.nodes['setPin'].value

    var boxes = pin.split('')

    if(boxes.length === 4) {
      ractive.nodes.setPin.blur()
      ractive.fire('enter-pin')
    }

    for(var i=boxes.length; i<4; i++) {
      boxes[i] = null
    }
    ractive.set('boxes', boxes)

  })

  ractive.on('enter-pin', function(){

    setTimeout(function(){

      if(!validatePin(getPin())){
        emitter.emit('clear-pin')
        return showError({ message: 'PIN must be a 4-digit number' })
      }

      ractive.set('opening', true)

      if(userExists) {
        ractive.set('progress', 'Verifying PIN')
        return CS.walletExists(function(walletExists){
          if(walletExists) { return openWithPin() }
          setPin()
        })
      }
      ractive.set('progress', 'Setting PIN')
      ractive.set('userExists', true)
      setPin()

    }, 500)

  })

  emitter.on('clear-pin', function() {
    ractive.nodes['setPin'].value = ''
    ractive.set('pin', '')
    ractive.set('boxes', [null, null, null, null])
  })

  ractive.on('clear-credentials', function(){
    CS.reset(function(){
      location.reload(false);
    })
  })

  ractive.on('back', function(){
    if(prevPage) prevPage(data)
    ractive.teardown()
  })

  function getPin(){
    var pin = ractive.get('pin')
    return pin ? pin.toString() : ''
  }

  function openWithPin(){
    CS.openWalletWithPin(getPin(), ractive.getNetwork(),
                         ractive.onSyncDone, null, ractive.onBalanceDone)
  }

  function setPin(){
    CS.setPin(getPin(), phone, ractive.getNetwork(),
              ractive.onSyncDone, null, ractive.onBalanceDone)
  }

  return ractive
}

