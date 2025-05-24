import { base64 } from '@scure/base';
import { cbc } from '@noble/ciphers/aes.js';
import { md5 } from '@noble/hashes/legacy.js';
import {
  abytes,
  bytesToUtf8,
  concatBytes,
  randomBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

export function evpBytesToKey(password, salt = new Uint8Array(0), keyLen = 32, ivLen = 16, count = 1) {
  abytes(password);
  abytes(salt, 0, 8);
  let derived = new Uint8Array(0);
  let block = new Uint8Array(0);

  while (derived.length < (keyLen + ivLen)) {
    block = md5(concatBytes(block, password, salt));
    for (let i = 1; i < count; i++) {
      block = md5(block);
    }
    derived = concatBytes(derived, block);
  }

  return {
    key: derived.slice(0, keyLen),
    iv: derived.slice(keyLen, keyLen + ivLen),
  };
}

export function encrypt(data, password) {
  if (typeof data !== 'string') {
    throw new TypeError('data must be a string');
  }
  if (typeof password !== 'string') {
    throw new TypeError('key must be a string');
  }
  const salt = randomBytes(8);
  const { key, iv } = evpBytesToKey(utf8ToBytes(password), salt, 32, 16);
  const encrypted = concatBytes(
    utf8ToBytes('Salted__'),
    salt,
    cbc(key, iv).encrypt(utf8ToBytes(data))
  );
  return base64.encode(encrypted);
}

export function decrypt(data, password) {
  if (typeof data !== 'string') {
    throw new TypeError('data must be a string');
  }
  if (typeof password !== 'string') {
    throw new TypeError('key must be a string');
  }
  const encrypted = base64.decode(data);
  const salt = encrypted.slice(8, 16);
  const { key, iv } = evpBytesToKey(utf8ToBytes(password), salt, 32, 16);
  return bytesToUtf8(cbc(key, iv).decrypt(encrypted.slice(16)));
}

export function encryptJSON(json, key) {
  return encrypt(JSON.stringify(json), key);
}

export function decryptJSON(text, key) {
  return JSON.parse(decrypt(text, key));
}

export default {
  encrypt,
  encryptJSON,
  decrypt,
  decryptJSON,
};
