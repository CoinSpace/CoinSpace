import request from 'lib/request';

const state = {
  settings: null,
};

function init() {
  return request({
    url: `${process.env.SITE_URL}api/v2/settings`,
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
      url: `${process.env.SITE_URL}api/v2/settings`,
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

export default {
  get,
  set,
  clientSet,
  init,
};
