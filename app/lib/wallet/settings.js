'use strict';

const request = require('lib/request');
const { urlRoot } = window;
const LS = require('./localStorage');

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

async function set(key, value, security) {
  const { unlock, lock } = security;
  const data = {};
  data[key] = value;
  try {
    await unlock();
    await request({
      url: `${urlRoot}v2/settings?id=${LS.getId()}`,
      method: 'patch',
      data,
      seed: 'private',
    });
    state.settings[key] = value;
    lock();
  } catch (err) {
    lock();
    throw err;
  }
}

function clientSet(key, value) {
  state.settings[key] = value;
}

module.exports = {
  get,
  set,
  clientSet,
  init,
};
