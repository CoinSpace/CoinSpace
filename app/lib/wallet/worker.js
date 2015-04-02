'use strict';

var B39 = require('b39')

module.exports = function (self) {
  self.addEventListener('message', function(e) {
    var data = e.data || {}
    var mnemonic = data.passphrase || B39.entropyToMnemonic(data.entropy)

    var valid = B39.validateMnemonic(mnemonic)
    if(!valid) {
      throw new Error('Invalid passphrase')
    }
    var seed = B39.mnemonicToSeedHex(mnemonic)

    self.postMessage({seed: seed, mnemonic: mnemonic})
  }, false);
}

