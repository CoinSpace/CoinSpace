'use strict';

var request = require('lib/request')
var db = require('lib/db')
var urlRoot = process.env.SITE_URL

function register(wallet_id, pin, callback) {
  postCredentials('register', { wallet_id: wallet_id, pin: pin }, callback)
}

function login(wallet_id, pin, callback) {
  postCredentials('login', { wallet_id: wallet_id, pin: pin }, callback)
}

function exist(wallet_id, callback) {
  request({
    url: urlRoot + 'exist?wallet_id=' + wallet_id
  }, callback)
}

function remove(wallet_id, callback) {
  request({
    url: urlRoot + 'account',
    method: 'delete',
    data: {
      id: wallet_id
    }
  }, callback)
}

function setUsername(wallet_id, username, callback) {
  var userInfo = db.get('userInfo');
  var oldUsername = (userInfo.firstName || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
  username = (username || '').toLowerCase().replace(/[^a-z0-9-]/g, '')

  if(username == oldUsername) return callback(null, userInfo.firstName);

  request({
    url: urlRoot + 'username',
    method: 'put',
    data: {
      id: wallet_id,
      username: username
    }
  }, function(err, data) {
    if (err) return callback(err);
    return callback(null, data.username);
  })
}

function postCredentials(endpoint, data, callback) {
  request({
    url: urlRoot + endpoint,
    method: 'post',
    data: data
  }, callback)
}

module.exports = {
  register: register,
  login: login,
  exist: exist,
  remove: remove,
  setUsername: setUsername
}
