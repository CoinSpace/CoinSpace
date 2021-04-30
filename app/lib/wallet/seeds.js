import encryption from 'lib/encryption';
import LS from './localStorage';

const seeds = {
  public: null,
  private: null,
};

function get(type) {
  return seeds[type];
}

function set(type, seed) {
  seeds[type] = seed;
}

function lock(type) {
  set(type, null);
}

function unlock(type, token) {
  seeds[type] = encryption.decrypt(LS.getEncryptedSeed(type), token);
}

export default {
  get,
  set,
  lock,
  unlock,
};
