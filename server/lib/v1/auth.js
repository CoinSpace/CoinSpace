'use strict';

var db = require('./db');
var userDB = db('_users');
var crypto = require('crypto');

var userPrefix = "org.couchdb.user:"

function exist(walletId) {
  var collection = db().collection('users');
  return collection
    .find({_id: walletId})
    .limit(1)
    .next().then(function(user) {
      if (!user) return false;
      return true;
    });
}

function register(walletId, pin) {
  return exist(walletId).then(function(userExist) {
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
      if (!user) return Promise.reject({error: 'auth_failed'});
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
    failed_attempts: 0,
    username_sha: ''
  }).then(function() {
    return token;
  });
}

function setUsername(name, username, callback) {
  var error = {error: 'set_username_failed'};
  name = userPrefix + name;
  userDB.get(name, function (err, user) {
    if (err) {
      console.error('error getting doc', err);
      return callback(error);
    }

    validateUsername(username, function(err, username) {
      if (err) return callback(err);
      var username_sha = generateUsernameHash(username);
      userDB.merge(user._id, {username_sha: username_sha}, function(err, res) {
        if (err) {
          console.error('FATAL: failed to update username_sha');
          return callback(error);
        }
        callback(null, username);
      });
    });
  });
}

function validateUsername(username, callback) {
  username = username.toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!username) return callback({'error': 'Username is invalid'})

  userDB.view('users/username_sha', { key: generateUsernameHash(username)}, function (err, res) {
    if(err) return callback({error: 'users view error'});

    if(res.length == 0) {
      callback(null, username);
    } else {
      callback({error: 'username_exists'});
    }
  });
}

function remove(id) {
  var collection = db().collection('users');
  return collection.removeOne({_id: id});
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

function generateUsernameHash(username) {
  var hash = crypto.createHash('sha1');
  hash.update(username + process.env.USERNAME_SALT);
  return hash.digest('hex');
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
  login: login,
  exist: exist,
  remove: remove,
  setUsername: setUsername
}
