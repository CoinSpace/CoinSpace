'use strict';

const request = require('lib/request');
const { urlRoot } = window;
const LS = require('lib/wallet/localStorage');

const state = {
  settings: null,
};

function init() {
  return request({
    url: `${urlRoot}v2/settings?id=${LS.getId()}`,
    method: 'get',
    seed: 'public',
  }).then((settings) => {
    state.settings = settings;
  });
}

function get(key) {
  if (state.settings === null) throw new Error('settings not ready');
  if (!key) {
    return state.settings;
  }
  return state.settings[key];
}

function set(key, value) {
  // TODO
}

module.exports = {
  get,
  set,
  init,
};
