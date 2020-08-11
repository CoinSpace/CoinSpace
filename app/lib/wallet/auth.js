'use strict';
const request = require('lib/request');
const db = require('lib/db');
const urlRoot = window.urlRoot;

function register(walletId, pin, callback) {
  postCredentials('v1/register', { wallet_id: walletId, pin }, callback);
}

function login(walletId, pin, callback) {
  postCredentials('v1/login', { wallet_id: walletId, pin }, callback);
}

function exist(walletId, callback) {
  request({
    url: urlRoot + 'v1/exist?wallet_id=' + walletId,
  }, callback);
}

function remove(walletId, callback) {
  request({
    url: urlRoot + 'v1/account',
    method: 'delete',
    data: {
      id: walletId,
    },
  }, callback);
}

function setUsername(walletId, username, callback) {
  const userInfo = db.get('userInfo');
  const oldUsername = (userInfo.firstName || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  username = (username || '').toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (username == oldUsername) {
    return callback(null, userInfo.firstName);
  }

  request({
    url: urlRoot + 'v1/username',
    method: 'put',
    data: {
      id: walletId,
      username,
    },
  }, function(err, data) {
    if (err) {
      return callback(err);
    }
    return callback(null, data.username);
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
  register,
  login,
  exist,
  remove,
  setUsername,
};
