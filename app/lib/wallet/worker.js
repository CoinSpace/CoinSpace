'use strict';

const B39 = require('b39');

self.addEventListener('message', (e) => {
  const data = e.data || {};
  const mnemonic = data.passphrase || B39.generateMnemonic(128);

  const isValid = B39.validateMnemonic(mnemonic);
  if (!isValid) {
    throw new Error('Invalid passphrase');
  }
  const seed = B39.mnemonicToSeedHex(mnemonic);
  self.postMessage({ seed, mnemonic });
}, false);
