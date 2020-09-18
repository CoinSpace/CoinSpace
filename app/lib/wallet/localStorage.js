'use strict';
const encryption = require('lib/encryption');
const { getToken, setToken } = require('lib/token');
const { localStorage } = window;

function getEncryptedSeed(type) {
  if (type === 'public' || type === 'private') {
    return localStorage.getItem(type);
  }
  throw new Error('Wrong seed type');
}

function setEncryptedSeed(type, encryptedSeed) {
  if (type === 'public' || type === 'private') {
    return localStorage.setItem(type, encryptedSeed);
  }
  throw new Error('Wrong seed type');
}

function getId() {
  return localStorage.getItem('id');
}

function setId(id) {
  localStorage.setItem('id', id);
}

function getPinKey() {
  return localStorage.getItem('pinKey');
}

function setPinKey(pinKey) {
  localStorage.setItem('pinKey', pinKey);
}

function getDetailsKey() {
  return localStorage.getItem('detailsKey');
}

function setDetailsKey(detailsKey) {
  localStorage.setItem('detailsKey', detailsKey);
}

function getPublicKey(networkName, token) {
  return encryption.decrypt(localStorage.getItem(`_cs_public_key_${networkName}`), token);
}

function setPublicKey(wallet, token) {
  const publicKey = encryption.encrypt(wallet.publicKey(), token);
  localStorage.setItem(`_cs_public_key_${wallet.networkName}`, publicKey);
}

// DEPRECATED
function getCredentials() {
  const credentials = localStorage.getItem('_cs_credentials');
  return credentials ? JSON.parse(encryption.decrypt(credentials, 'seedCoinspace')) : null;
}

// DEPRECATED
function deleteCredentialsLegacy() {
  localStorage.removeItem('_cs_credentials');
}

function getPin() {
  const pin = localStorage.getItem('_pin_cs');
  return pin ? encryption.decrypt(pin, 'pinCoinSpace') : null;
}

function setPin(pin) {
  localStorage.setItem('_pin_cs', encryption.encrypt(pin, 'pinCoinSpace'));
}

function isRegistered() {
  return !!localStorage.getItem('id')
    && !!localStorage.getItem('public')
    && !!localStorage.getItem('private')
    && !!localStorage.getItem('pinKey')
    && !!localStorage.getItem('detailsKey');
}

function isRegisteredLegacy() {
  return !!getCredentials();
}

function reset() {
  const token = getToken();
  localStorage.clear();
  setToken(token);
}

function isFidoTouchIdEnabled() {
  return !!localStorage.getItem('_cs_touchid_enabled');
}

function setFidoTouchIdEnabled(value) {
  return localStorage.setItem('_cs_touchid_enabled', value);
}

module.exports = {
  getCredentials, // DEPRECATED
  deleteCredentialsLegacy, // DEPRECATED
  getPin,
  setPin,

  getEncryptedSeed,
  setEncryptedSeed,

  isRegistered,
  isRegisteredLegacy,
  getId,
  setId,
  getPinKey,
  setPinKey,
  getDetailsKey,
  setDetailsKey,
  getPublicKey,
  setPublicKey,
  reset,
  isFidoTouchIdEnabled,
  setFidoTouchIdEnabled,
};
