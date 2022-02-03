import _ from 'lodash';
import { encrypt, decrypt } from 'lib/encryption';
import request from 'lib/request';
import LS from './localStorage';
import tetherToken from '@coinspace/crypto-db/crypto/tether@ethereum.json';

const state = {
  details: null,
};

function init() {
  return request({
    url: `${process.env.SITE_URL}api/v3/details`,
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

async function _initDetails() {
  const defaultValue = {
    systemInfo: { preferredCurrency: 'USD' },
    userInfo: {
      username: '',
      email: '',
    },
    tokens: [
      tetherToken,
    ],
  };
  return _save(defaultValue);
}

function _save(data) {
  const key = LS.getDetailsKey();
  return request({
    url: `${process.env.SITE_URL}api/v3/details`,
    method: 'put',
    data: {
      data: encrypt(JSON.stringify(data), key),
    },
    seed: 'public',
  }).then((details) => JSON.parse(decrypt(details.data, key)));
}

export default {
  get,
  set,
  init,
};
