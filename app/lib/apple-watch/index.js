'use strict';

var emitter = require('cs-emitter')
var CS = require('cs-wallet-js')
var getNetwork = require('cs-network')
var yaqrcode = require('yaqrcode')

var appGroupId = ''
var isSubscribed = false

function initWatch(groupId) {
	if (window.buildPlatform === 'ios') {
		appGroupId = groupId
        applewatch.init(onSuccessInitAppleWatch, onErrorInitAppleWatch, groupId)
	}
}

function sendMessage(message, queueName) {
    if (window.buildPlatform === 'ios') {
        applewatch.sendMessage(message, queueName, function() {
            // alert('success send message ' + message)
        }, function() {
            // alert('failed to send message')
        })
    }
}

function subscribeForNotification() {
    applewatch.addListener('requestCommandQueue', function(message) {
    //   alert('receive command: ' + message)
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
    
        applewatch.sendMessage(response, 'comandAnswerQueue', function() {
        // alert('success send qrMessage')
      }, function() {
        // alert('failed send qrMessage')
      })
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
    isSubscribed = true
}

function onSuccessInitAppleWatch(groupId) {
    console.log('success init with ' + groupId);
    // alert('success init with ' + groupId)
    if (!isSubscribed) {
        subscribeForNotification()
    }
}
  
function onErrorInitAppleWatch() {
    console.log('failed init apple watch module');
    // alert('failed init apple watch module')
}
  
function onSuccessUserDefaults() {
    console.log('success on user defaults')
}
  
function onErrorUserDefaults() {
	console.log('error on user defaults')
}

module.exports = {
    initWatch: initWatch,
    sendMessage: sendMessage
}