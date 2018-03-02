'use strict';

var db = require('./db');
var crypto = require('crypto');

function isExist(walletId) {
  var collection = db().collection('users');
  return collection
    .find({_id: walletId}, {projection: {_id: 1}})
    .limit(1)
    .next().then(function(user) {
      if (!user) return false;
      return true;
    });
}

function remove(id) {
  return Promise.all([
    db().collection('users').deleteOne({_id: id}),
    db().collection('details').deleteOne({_id: id})
  ]);
}

function getDetails(walletId) {
  var collection = db().collection('details');
  return collection
    .find({_id: walletId})
    .limit(1)
    .next().then(function(doc) {
      if (!doc) return doc;
      return doc.data;
    });
}

function saveDetails(walletId, data) {
  var collection = db().collection('details');
  return collection.updateOne({_id: walletId}, {$set: {data: data}}, {upsert: true}).then(function() {
    return data;
  });
}

function setUsername(walletId, username) {
  var collection = db().collection('users');
  return collection
    .find({_id: walletId})
    .limit(1)
    .next().then(function(user) {
      if (!user) return Promise.reject({error: 'error getting doc'});

      username = username.toLowerCase().replace(/[^a-z0-9-]/g, '');
      var username_sha = crypto.createHash('sha1').update(username + process.env.USERNAME_SALT).digest('hex');
      return db().collection('details').updateOne({_id: user._id}, {$set: {
        username_sha: username_sha
      }}, {upsert: true}).then(function() {
        return username;
      }).catch(function(error) {
        if (error && error.message && error.message.match(/E11000 duplicate key error/)) {
          return Promise.reject({error: 'username_exists'});
        }
        return Promise.reject(error)
      });
    });
}

module.exports = {
  isExist: isExist,
  remove: remove,
  getDetails: getDetails,
  saveDetails: saveDetails,
  setUsername: setUsername
}
