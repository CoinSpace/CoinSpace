'use strict';

const B39 = require('b39');
const crypto = require('crypto');

self.addEventListener('message', function(e) {
  const data = e.data || {};
  const mnemonic = data.passphrase || B39.generateMnemonic(128);
  const key = crypto.randomBytes(32).toString('hex');

  const isValid = B39.validateMnemonic(mnemonic);
  if (!isValid) {
    throw new Error('Invalid passphrase');
  }
  const seed = B39.mnemonicToSeedHex(mnemonic);
  self.postMessage({ seed, mnemonic, key });
}, false);
