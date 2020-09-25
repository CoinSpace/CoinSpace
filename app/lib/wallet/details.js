'use strict';

const _ = require('lodash');
const { encrypt, decrypt } = require('lib/encryption');
const { randAvatarIndex } = require('lib/avatar');

const request = require('lib/request');
const { urlRoot } = window;
const LS = require('lib/wallet/localStorage');

const state = {
  details: null,
};

function init() {
  return request({
    url: `${urlRoot}v2/details?id=${LS.getId()}`,
    method: 'get',
    seed: 'public',
  }).then((details) => {
    if (!details.data) {
      return _initDetails();
    }
    return JSON.parse(decrypt(details.data, LS.getDetailsKey()));
  }).then((details) => {
    state.details = details;
  });
}

function get(key) {
  if (state.details === null) throw new Error('details not ready');
  if (!key) {
    return state.details;
  }
  return state.details[key];
}

function set(key, value) {
  if (state.details === null) return Promise.reject(new Error('details not ready'));
  if (state.details[key] && value && typeof value === 'object' && value.constructor === Object) {
    _.merge(state.details[key], value);
  } else {
    state.details[key] = value;
  }
  return _save(state.details)
    .then((data) => {
      state.details = data;
    });
}

function _initDetails() {
  const defaultValue = {
    systemInfo: { preferredCurrency: 'USD' },
    userInfo: {
      firstName: '',
      lastName: '',
      email: '',
      avatarIndex: randAvatarIndex(),
    },
  };
  return _save(defaultValue);
}

function _save(data) {
  const key = LS.getDetailsKey();
  return request({
    url: `${urlRoot}v2/details?id=${LS.getId()}`,
    method: 'put',
    data: {
      data: encrypt(JSON.stringify(data), key),
    },
    seed: 'public',
  }).then((details) => JSON.parse(decrypt(details.data, key)));
}

module.exports = {
  get,
  set,
  init,
};
