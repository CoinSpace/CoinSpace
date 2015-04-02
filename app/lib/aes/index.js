var CJS = require('crypto-js')
var AES = CJS.AES
var utf8Encode = CJS.enc.Utf8

function encrypt(text, key) {
  return AES.encrypt(text, key).toString()
}

function decrypt(text, key) {
  return utf8Encode.stringify(AES.decrypt(text, key))
}

module.exports = {
  encrypt: encrypt,
  decrypt: decrypt
}
