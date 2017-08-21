'use strict';

var B39 = require('b39')

function IeWorker() {
  this.onerror = null;
  this.onmessage = null;
}

IeWorker.prototype.postMessage = function(data) {
  var that = this;
  setTimeout(function() {
    var mnemonic = data.passphrase || B39.entropyToMnemonic(data.entropy)

    var valid = B39.validateMnemonic(mnemonic)
    if(!valid) {
      return that.onerror({message: 'Invalid passphrase'})
    }
    var seed = B39.mnemonicToSeedHex(mnemonic)
    that.onmessage({data: {seed: seed, mnemonic: mnemonic}})
  }, 1)
}

module.exports = IeWorker;
