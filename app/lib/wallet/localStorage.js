import encryption from 'lib/encryption';
const { localStorage } = window;

function getEncryptedSeed(type) {
  if (type === 'public' || type === 'private') {
    return localStorage.getItem(`_cs_${type}`);
  }
  throw new Error('Wrong seed type');
}

function setEncryptedSeed(type, encryptedSeed) {
  if (type === 'public' || type === 'private') {
    return localStorage.setItem(`_cs_${type}`, encryptedSeed);
  }
  throw new Error('Wrong seed type');
}

function getId() {
  return localStorage.getItem('_cs_id');
}

function setId(id) {
  localStorage.setItem('_cs_id', id);
}

function getPinKey() {
  return localStorage.getItem('_cs_pin_key');
}

function setPinKey(pinKey) {
  localStorage.setItem('_cs_pin_key', pinKey);
}

function getDetailsKey() {
  return localStorage.getItem('_cs_details_key');
}

function setDetailsKey(detailsKey) {
  localStorage.setItem('_cs_details_key', detailsKey);
}

function getCryptoId() {
  return localStorage.getItem('_cs_crypto_id');
}

function setCryptoId(cryptoId) {
  localStorage.setItem('_cs_crypto_id', cryptoId);
}

function getCache(crypto, token) {
  return JSON.parse(encryption.decrypt(localStorage.getItem(`_cs_cache_${crypto._id}`), token));
}

function hasCache(crypto) {
  return !!localStorage.getItem(`_cs_cache_${crypto._id}`);
}

function setCache(crypto, cache, token) {
  localStorage.setItem(`_cs_cache_${crypto._id}`, encryption.encrypt(JSON.stringify(cache), token));
}

function unsetCache(crypto) {
  localStorage.removeItem(`_cs_cache_${crypto._id}`);
}

function hasPublicKey(platform) {
  return !!localStorage.getItem(`_cs_public_key_${platform}`);
}

function getPublicKey(platform, token) {
  return encryption.decrypt(localStorage.getItem(`_cs_public_key_${platform}`), token);
}

function setPublicKey(wallet, token) {
  const publicKey = encryption.encrypt(wallet.publicKey(), token);
  localStorage.setItem(`_cs_public_key_${wallet.crypto.platform}`, publicKey);
}

function migratePublicKeys() {
  [
    ['bitcoincash', 'bitcoin-cash'],
    ['bitcoinsv', 'bitcoin-sv'],
  ].forEach(([from, to]) => {
    const publicKey = localStorage.getItem(`_cs_public_key_${from}`);
    if (publicKey) {
      localStorage.setItem(`_cs_public_key_${to}`, publicKey);
      localStorage.removeItem(`_cs_public_key_${from}`);
    }
  });
}

function renameTokenId(idFrom, idTo) {
  if (!idFrom) return;
  if (localStorage.getItem(`_cs_cache_${idFrom}`)) {
    localStorage.setItem(`_cs_cache_${idTo}`, localStorage.getItem(`_cs_cache_${idFrom}`));
    localStorage.removeItem(`_cs_cache_${idFrom}`);
  }
  const cryptoId = getCryptoId();
  if (cryptoId && cryptoId === idFrom) {
    setCryptoId(idTo);
  }
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
  if (!pin) return localStorage.removeItem('_pin_cs');
  localStorage.setItem('_pin_cs', encryption.encrypt(pin, 'pinCoinSpace'));
}

function isRegistered() {
  return !!localStorage.getItem('_cs_id')
    && !!localStorage.getItem('_cs_public')
    && !!localStorage.getItem('_cs_private')
    && !!localStorage.getItem('_cs_pin_key')
    && !!localStorage.getItem('_cs_details_key');
}

function isRegisteredLegacy() {
  return !!getCredentials();
}

function reset() {
  localStorage.clear();
}

function isFidoTouchIdEnabled() {
  return !!localStorage.getItem('_cs_touchid_enabled');
}

function setFidoTouchIdEnabled(value) {
  if (!value) return localStorage.removeItem('_cs_touchid_enabled');
  return localStorage.setItem('_cs_touchid_enabled', value);
}

export default {
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
  getCryptoId,
  setCryptoId,
  hasPublicKey,
  getPublicKey,
  setPublicKey,
  reset,
  isFidoTouchIdEnabled,
  setFidoTouchIdEnabled,
  getCache,
  setCache,
  unsetCache,
  hasCache,
  migratePublicKeys,
  renameTokenId,
};
