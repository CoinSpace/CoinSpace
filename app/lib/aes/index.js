'use strict';

const CryptoJS = require('crypto-js');

function encrypt(text, key) {
  return CryptoJS.AES.encrypt(text, key).toString();
}

function decrypt(text, key) {
  return CryptoJS.enc.Utf8.stringify(CryptoJS.AES.decrypt(text, key));
}

module.exports = {
  encrypt,
  decrypt,
};
