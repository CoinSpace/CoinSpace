import AES from 'crypto-js/aes.js';
import Utf8 from 'crypto-js/enc-utf8.js';

export function encrypt(data, key) {
  if (typeof data !== 'string') {
    throw new TypeError('data must be a string');
  }
  if (typeof key !== 'string') {
    throw new TypeError('key must be a string');
  }
  return AES.encrypt(data, key).toString();
}

export function encryptJSON(json, key) {
  return encrypt(JSON.stringify(json), key);
}

export function decrypt(data, key) {
  if (typeof data !== 'string') {
    throw new TypeError('data must be a string');
  }
  if (typeof key !== 'string') {
    throw new TypeError('key must be a string');
  }
  return AES.decrypt(data, key).toString(Utf8);
}

export function decryptJSON(text, key) {
  return JSON.parse(decrypt(text, key).toString('utf8'));
}

export default {
  encrypt,
  encryptJSON,
  decrypt,
  decryptJSON,
};
