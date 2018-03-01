'use strict';
var AES = require('lib/aes');

function saveEncrypedSeed(id, encryptedSeed) {
  var data = {
    id: id,
    seed: encryptedSeed
  };
  window.localStorage.setItem('_cs_credentials', AES.encrypt(JSON.stringify(data), 'seedCoinspace'));
}

function getCredentials() {
  var credentials = window.localStorage.getItem('_cs_credentials');
  return credentials ? JSON.parse(AES.decrypt(credentials, 'seedCoinspace')) : null;
}

function deleteCredentials() {
  window.localStorage.removeItem('_cs_credentials');
}

module.exports = {
  saveEncrypedSeed: saveEncrypedSeed,
  getCredentials: getCredentials,
  deleteCredentials: deleteCredentials
}
