import crypto from 'crypto';
import EVPBytesToKey from 'evp_bytestokey';

export function encrypt(text, key) {
  const salt = crypto.randomBytes(8);
  const result = EVPBytesToKey(key, salt, 256, 16);
  const cipher = crypto.createCipheriv('aes-256-cbc', result.key, result.iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  encrypted = Buffer.concat([Buffer.from('Salted__'), salt, encrypted]);
  return encrypted.toString('base64');
}

function encryptJSON(json, key) {
  return encrypt(JSON.stringify(json), key);
}

export function decrypt(text, key) {
  const encryptedBytesWithSalt = Buffer.from(text, 'base64');
  const encryptedBytes = encryptedBytesWithSalt.slice(16, encryptedBytesWithSalt.length);
  const salt = encryptedBytesWithSalt.slice(8, 16);
  const result = EVPBytesToKey(key, salt, 256, 16);
  const cipher = crypto.createDecipheriv('aes-256-cbc', result.key, result.iv);
  let decrypted = cipher.update(encryptedBytes);
  decrypted = Buffer.concat([decrypted, cipher.final()]);
  return decrypted.toString('utf8');
}

function decryptJSON(text, key) {
  return JSON.parse(decrypt(text, key));
}

export default {
  encrypt,
  encryptJSON,
  decrypt,
  decryptJSON,
};
