'use strict';

var emitter = require('cs-emitter')
var CS = require('cs-wallet-js')
var getNetwork = require('cs-network')
var yaqrcode = require('yaqrcode')

var appGroupId = ''
var isSubscribed = false
var lastRates
var transactionHistory

function initWatch(groupId) {
	if (window.buildPlatform === 'ios') {
		appGroupId = groupId
        applewatch.init(onSuccessInitAppleWatch, onErrorInitAppleWatch, groupId)
	}
}

function sendMessage(message, queueName) {
    if (window.buildPlatform === 'ios') {
        applewatch.sendMessage(message, queueName)
    }
}

function setRates(rates) {
    lastRates = rates
}

function setTransactionHistory(transactions) {
    transactionHistory = transactions
}

// function sendUserDefaults(key, value) {
//     if (key === "rates") {
//         applewatch.sendUserDefaults(function() {
//             console.log('success write rates to userDefaults with appGroupId = ' + appGroupId)
//         }, function() {
//             console.log('failed to write rates to userDefaults with appGroupId = ' + appGroupId)
//         }, {key: JSON.stringify(value)}, appGroupId)
//     }
// }

function subscribeForNotification() {
    applewatch.addListener('requestCommandQueue', function(message) {
      console.log('receive command: ' + message)
      
      if (message === 'updateBalance') {
        console.log('receive request balanceUdpate');
        var response = {}
        response.command = 'balanceMessage'
        response.balance = CS.getWallet().getBalance()
        response.denomination = CS.getWallet().denomination
        response.walletId = CS.getWallet().getNextAddress()
      
        applewatch.sendMessage(response, 'comandAnswerQueue')
        
        var responseRates = {}
        responseRates.command = 'currencyMessage'
        responseRates.currency = lastRates
        
        applewatch.sendMessage(responseRates, 'comandAnswerQueue')
      } else if (message === 'getQrCode') {
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
      } else if (message === 'transactionMessage') {
        var response = {}
        response.command = 'transactionMessage'
        response.transactions = transactionHistory
        
        applewatch.sendMessage(response, 'comandAnswerQueue')
      }
    });
    isSubscribed = true
}

function onSuccessInitAppleWatch(groupId) {
    console.log('success init with ' + groupId);
    if (!isSubscribed) {
        subscribeForNotification()
    }
}
  
function onErrorInitAppleWatch() {
    console.log('failed init apple watch module');
}
  
module.exports = {
    initWatch: initWatch,
    sendMessage: sendMessage,
    setRates: setRates,
    setTransactionHistory: setTransactionHistory
    // sendUserDefaults: sendUserDefaults
}