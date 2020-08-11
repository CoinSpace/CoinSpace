'use strict';

const emitter = require('lib/emitter');
const _ = require('lodash');
const AES = require('lib/aes');
const { randAvatarIndex } = require('lib/avatar');
const encrypt = AES.encrypt;
const decrypt = AES.decrypt;

const request = require('lib/request');
const urlRoot = window.urlRoot;

let id = null;
let secret = null;
let details = null;

function set(key, value) {
  if (id === null) return Promise.reject(new Error('wallet not ready'));
  const data = JSON.parse(decrypt(details, secret));
  if (data[key] && value && typeof value === 'object' && value.constructor === Object) {
    _.merge(data[key], value);
  } else {
    data[key] = value;
  }
  return save(data).then(function(doc) {
    details = doc;
  });
}

function initDetails() {
  const defaultValue = {
    systemInfo: { preferredCurrency: 'USD' },
    userInfo: {
      firstName: '',
      lastName: '',
      email: '',
      avatarIndex: randAvatarIndex(),
    },
  };
  return save(defaultValue);
}

function save(data) {
  return request({
    url: urlRoot + 'v1/details',
    method: 'put',
    data: {
      id,
      data: encrypt(JSON.stringify(data), secret),
    },
  });
}

function get(key) {
  if (id === null) return console.error('wallet not ready');
  const data = JSON.parse(decrypt(details, secret));
  if (!key) {
    return data;
  }
  return data[key];
}

emitter.on('wallet-init', function(data) {
  secret = data.seed;
  id = data.id;
});

emitter.on('db-init', function() {
  request({
    url: urlRoot + 'v1/details?id=' + id,
  }).then(function(doc) {
    if (!doc) {
      return initDetails();
    }
    return doc;
  }).then(function(doc) {
    details = doc;
    emitter.emit('db-ready');
  }).catch(function(err) {
    console.error(err);
    emitter.emit('db-ready', err);
  });
});

module.exports = {
  get,
  set,
};
