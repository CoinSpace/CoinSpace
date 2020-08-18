'use strict';

const CryptoJS = require('crypto-js');

function encrypt(text, key) {
  return CryptoJS.AES.encrypt(text, key).toString();
}

function decrypt(text, key) {
  return CryptoJS.enc.Utf8.stringify(CryptoJS.AES.decrypt(text, key));
}

// pin: Array, key: hex String
function sha256pin(pin, key) {
  return CryptoJS.HmacSHA256(
    CryptoJS.lib.WordArray.create(new Uint8Array(pin)), CryptoJS.enc.Hex.parse(key)).toString();
}

module.exports = {
  encrypt,
  decrypt,
  sha256pin,
};
