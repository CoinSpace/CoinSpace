'use strict';

var db = require('./db');
var account = require('./account');
var crypto = require('crypto');

function register(walletId, pin) {
  return account.isExist(walletId).then(function(userExist) {
    if (!userExist) {
      return createUser(walletId, pin);
    }
    return login(walletId, pin);
  });
}

function login(walletId, pin) {
  var collection = db().collection('users');
  return collection
    .find({_id: walletId})
    .limit(1)
    .next().then(function(user) {
      if (!user) return Promise.reject({error: 'user_deleted'});
      return verifyPin(user, pin);
    });
}

function createUser(walletId, pin) {
  var collection = db().collection('users');
  var token = generateToken();
  var password = token + pin;
  var hashAndSalt = generatePasswordHash(password);
  return collection.insertOne({
    _id: walletId,
    password_sha: hashAndSalt[0],
    salt: hashAndSalt[1],
    token: token,
    failed_attempts: 0
  }).then(function() {
    return token;
  });
}

function generateToken() {
  return crypto.randomBytes(64).toString('hex');
}

function generatePasswordHash(password) {
  var salt = crypto.randomBytes(16).toString('hex');
  var hash = crypto.createHash('sha1');
  hash.update(password + salt);
  return [hash.digest('hex'), salt];
}

function verifyPin(user, pin) {
  pin = pin || '';
  var password = user.token + pin
  var hash = crypto.createHash('sha1')
  var sha = hash.update(password + user.salt).digest('hex')
  if (sha === user.password_sha) {
    if (user.failed_attempts) {
      updateFailCount(user._id, 0);
    }
    return user.token;
  }

  var counter = user.failed_attempts + 1;
  if (counter >= 5) return deleteUser(user._id);
  updateFailCount(user._id, counter);
  return Promise.reject({error: 'auth_failed'});
}

function updateFailCount(id, counter) {
  var collection = db().collection('users');
  return collection.updateOne({_id: id}, {$set: {failed_attempts: counter}});
}

function deleteUser(id) {
  var collection = db().collection('users');
  return collection.deleteOne({_id: id}).then(function() {
    return Promise.reject({error: 'user_deleted'});
  });
}

module.exports = {
  register: register,
  login: login
}
