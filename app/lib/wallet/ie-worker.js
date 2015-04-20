'use strict';

var B39 = require('b39')
var message = null
var error = null

function postMessage(data) {
  setTimeout(function() {
    var mnemonic = data.passphrase || B39.entropyToMnemonic(data.entropy)

    var valid = B39.validateMnemonic(mnemonic)
    if(!valid) {
      return error({message: 'Invalid passphrase'})
    }
    var seed = B39.mnemonicToSeedHex(mnemonic)
    message({data: {seed: seed, mnemonic: mnemonic}})
  }, 1)
}

function addCustomEventListener(event, callback) {
  if (event == 'message') {
    message = callback
  } else if (event == 'error') {
    error = callback
  }
}

module.exports = {
  postMessage: postMessage,
  addEventListener: addCustomEventListener
}
