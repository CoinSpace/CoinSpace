'use strict';

const emitter = require('lib/emitter');
const _ = require('lodash');
const { encrypt, decrypt } = require('lib/encryption');
const { randAvatarIndex } = require('lib/avatar');

const request = require('lib/request');
const { urlRoot } = window;

const state = {
  secret: null,
  details: null,
};

function set(key, value) {
  if (state.details === null) return Promise.reject(new Error('wallet not ready'));
  if (state.details[key] && value && typeof value === 'object' && value.constructor === Object) {
    _.merge(state.details[key], value);
  } else {
    state.details[key] = value;
  }
  return save(state.details)
    .then((data) => {
      state.details = data;
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
    url: `${urlRoot}v2/details`,
    method: 'put',
    data: {
      data: encrypt(JSON.stringify(data), state.secret),
    },
  }).then((details) => JSON.parse(decrypt(details.data, state.secret)));
}

function get(key) {
  if (state.details === null) return console.error('wallet not ready');
  if (!key) {
    return state.details;
  }
  return state.details[key];
}

emitter.on('wallet-init', (data) => {
  state.secret = data.seed;
});

emitter.on('db-init', () => {
  request({
    url: `${urlRoot}v2/details`,
  }).then((details) => {
    if (!details.data) {
      return initDetails();
    }
    return JSON.parse(decrypt(details.data, state.secret));
  }).then((data) => {
    state.details = data;
    emitter.emit('db-ready');
  }).catch((err) => {
    console.error(err);
    emitter.emit('db-error', err);
  });
});

module.exports = {
  get,
  set,
};
