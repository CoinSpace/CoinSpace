'use strict';
const encryption = require('lib/encryption');

function setKey(key) {
  window.localStorage.setItem('_cs_key', key);
}

function getKey() {
  return window.localStorage.getItem('_cs_key');
}

function setSeed(seed, token) {
  window.localStorage.setItem('_cs_seed', encryption.encrypt(seed, token));
}

function getSeed(token) {
  return encryption.decrypt(window.localStorage.getItem('_cs_seed'), token);
}

function setLoginJWT(jwt) {
  window.localStorage.setItem('_cs_login', jwt);
}

function getLoginJWT() {
  return window.localStorage.getItem('_cs_login');
}

// DEPRECATED
function getCredentials() {
  const credentials = window.localStorage.getItem('_cs_credentials');
  return credentials ? JSON.parse(encryption.decrypt(credentials, 'seedCoinspace')) : null;
}

// DEPRECATED
function deleteCredentials() {
  window.localStorage.removeItem('_cs_credentials');
}

function isRegistered() {
  return !!window.localStorage.getItem('_cs_login')
    && !!window.localStorage.getItem('_cs_seed')
    && !!window.localStorage.getItem('_cs_key');
}

function reset() {
  window.localStorage.removeItem('_cs_login');
  window.localStorage.removeItem('_cs_seed');
  window.localStorage.removeItem('_cs_key');
}

module.exports = {
  // DEPRECATED
  getCredentials,
  // DEPRECATED
  deleteCredentials,
  isRegistered,
  setKey,
  getKey,
  setSeed,
  getSeed,
  setLoginJWT,
  getLoginJWT,
  reset,
};
