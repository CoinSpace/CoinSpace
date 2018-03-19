'use strict';

var emitter = require('lib/emitter');
var merge = require('lodash.merge');
var AES = require('lib/aes');
var randAvatarIndex = require('lib/avatar').randAvatarIndex;
var encrypt = AES.encrypt;
var decrypt = AES.decrypt;

var request = require('lib/request');
var urlRoot = process.env.SITE_URL;

var id = null;
var secret = null;
var details = null;

function set(key, value) {
  if (id === null) return Promise.reject(new Error('wallet not ready'));
  var data = JSON.parse(decrypt(details, secret));
  if(data[key] && value && typeof value === 'object' && value.constructor === Object) {
    merge(data[key], value);
  } else {
    data[key] = value;
  }
  return save(data).then(function(doc) {
    details = doc;
  });
}

function initDetails() {
  var defaultValue = {
    systemInfo: { preferredCurrency: 'USD' },
    userInfo: {
      firstName: '',
      lastName: '',
      email: '',
      avatarIndex: randAvatarIndex()
    }
  }
  return save(defaultValue);
}

function save(data) {
  return request({
    url: urlRoot + 'details',
    method: 'put',
    data: {
      id: id,
      data: encrypt(JSON.stringify(data), secret)
    }
  })
}

function get(key) {
  if (id === null) return console.error('wallet not ready');
  var data = JSON.parse(decrypt(details, secret));
  if (!key) {
    return data;
  }
  return data[key];
}

emitter.once('wallet-init', function(data) {
  secret = data.seed;
  id = data.id;
})

emitter.once('db-init', function() {
  request({
    url: urlRoot + 'details?id=' + id
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
  get: get,
  set: set
}
