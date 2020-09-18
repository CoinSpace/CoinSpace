'use strict';
const encryption = require('lib/encryption');

function getEncryptedSeed(type) {
  if (type === 'public' || type === 'private') {
    return window.localStorage.getItem(type);
  }
  throw new Error('Wrong seed type');
}

function setEncryptedSeed(type, encryptedSeed) {
  if (type === 'public' || type === 'private') {
    return window.localStorage.setItem(type, encryptedSeed);
  }
  throw new Error('Wrong seed type');
}

function getId() {
  return window.localStorage.getItem('id');
}

function setId(id) {
  window.localStorage.setItem('id', id);
}

function getPinKey() {
  return window.localStorage.getItem('pinKey');
}

function setPinKey(pinKey) {
  window.localStorage.setItem('pinKey', pinKey);
}

function getDetailsKey() {
  return window.localStorage.getItem('detailsKey');
}

function setDetailsKey(detailsKey) {
  window.localStorage.setItem('detailsKey', detailsKey);
}

function getPublicKey(networkName, token) {
  return encryption.decrypt(window.localStorage.getItem(`_cs_public_key_${networkName}`), token);
}

function setPublicKey(wallet, token) {
  const publicKey = encryption.encrypt(wallet.publicKey(), token);
  window.localStorage.setItem(`_cs_public_key_${wallet.networkName}`, publicKey);
}

// DEPRECATED
function getCredentials() {
  const credentials = window.localStorage.getItem('_cs_credentials');
  return credentials ? JSON.parse(encryption.decrypt(credentials, 'seedCoinspace')) : null;
}

// DEPRECATED
function deleteCredentialsLegacy() {
  window.localStorage.removeItem('_cs_credentials');
}

function getPin() {
  const pin = window.localStorage.getItem('_pin_cs');
  return pin ? encryption.decrypt(pin, 'pinCoinSpace') : null;
}

function setPin(pin) {
  window.localStorage.setItem('_pin_cs', encryption.encrypt(pin, 'pinCoinSpace'));
}

function isRegistered() {
  return !!window.localStorage.getItem('id')
    && !!window.localStorage.getItem('public')
    && !!window.localStorage.getItem('private')
    && !!window.localStorage.getItem('pinKey')
    && !!window.localStorage.getItem('detailsKey');
}

function isRegisteredLegacy() {
  return !!getCredentials();
}

function reset() {
  window.localStorage.removeItem('id');
  window.localStorage.removeItem('public');
  window.localStorage.removeItem('private');
  window.localStorage.removeItem('pinKey');
  window.localStorage.removeItem('detailsKey');
  window.localStorage.removeItem('_cs_public_key_bitcoin');
  window.localStorage.removeItem('_cs_public_key_litecoin');
  window.localStorage.removeItem('_cs_public_key_bitcoincash');
  window.localStorage.removeItem('_cs_public_key_bitcoinsv');
  window.localStorage.removeItem('_cs_public_key_dogecoin');
  window.localStorage.removeItem('_cs_public_key_dash');
  window.localStorage.removeItem('_cs_public_key_ethereum');
  window.localStorage.removeItem('_cs_public_key_ripple');
  window.localStorage.removeItem('_cs_public_key_stellar');
  window.localStorage.removeItem('_cs_public_key_eos');
  window.localStorage.removeItem('_cs_touchid_enabled');
}

function isFidoTouchIdEnabled() {
  return !!window.localStorage.getItem('_cs_touchid_enabled');
}

function setFidoTouchIdEnabled(value) {
  return window.localStorage.setItem('_cs_touchid_enabled', value);
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
