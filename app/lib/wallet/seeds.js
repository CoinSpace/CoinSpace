'use strict';
const encryption = require('lib/encryption');
const LS = require('./localStorage');

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

module.exports = {
  get,
  set,
  lock,
  unlock,
};
