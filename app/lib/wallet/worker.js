'use strict';

var B39 = require('b39');

self.addEventListener('message', function(e) {
  var data = e.data || {};
  var mnemonic = data.passphrase || B39.entropyToMnemonic(data.entropy);

  var isValid = B39.validateMnemonic(mnemonic);
  if (!isValid) {
    throw new Error('Invalid passphrase');
  }
  var seed = B39.mnemonicToSeedHex(mnemonic);
  self.postMessage({seed: seed, mnemonic: mnemonic});
}, false);
