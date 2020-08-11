'use strict';

const B39 = require('b39');

self.addEventListener('message', function(e) {
  const data = e.data || {};
  const mnemonic = data.passphrase || B39.entropyToMnemonic(data.entropy);

  const isValid = B39.validateMnemonic(mnemonic);
  if (!isValid) {
    throw new Error('Invalid passphrase');
  }
  const seed = B39.mnemonicToSeedHex(mnemonic);
  self.postMessage({ seed, mnemonic });
}, false);
