'use strict';
const request = require('lib/request');
const details = require('lib/wallet/details');
const { urlRoot } = window;

// DEPRECATED
function loginDEPRECATED(walletId, pin, callback) {
  postCredentials('v1/login', { wallet_id: walletId, pin }, callback);
}

function login(jwt, pin) {
  return request({
    jwt,
    url: `${urlRoot}v2/login`,
    method: 'post',
    data: {
      pin,
    },
  });
}

function token() {
  return request({
    url: `${urlRoot}v2/token`,
    method: 'get',
  });
}

function remove() {
  return request({
    url: `${urlRoot}v2/account`,
    method: 'delete',
  });
}

function setUsername(username) {
  const userInfo = details.get('userInfo');
  const oldUsername = (userInfo.firstName || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const newUsername = (username || '').toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (newUsername === oldUsername) {
    return Promise.resolve(userInfo.firstName);
  }

  return request({
    url: `${urlRoot}v2/username`,
    method: 'put',
    data: {
      username: newUsername,
    },
  }).then((data) => {
    return data.username;
  });
}

function postCredentials(endpoint, data, callback) {
  request({
    url: urlRoot + endpoint,
    method: 'post',
    data,
  }, callback);
}

module.exports = {
  loginDEPRECATED,
  login,
  token,
  remove,
  setUsername,
};
