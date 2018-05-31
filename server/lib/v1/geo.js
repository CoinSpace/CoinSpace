'use strict';

var db = require('./db');
var crypto = require('crypto');
var SEARCH_RADIUS = 1000;

function save(lat, lon, userInfo) {
  return db().collection('details')
    .find({_id: userInfo.id}, {projection: {username_sha: 1}})
    .limit(1)
    .next().then(function(details) {
      if (!details) return Promise.reject({error: 'details_not_found'});
      var hash = crypto.createHash('sha1').update(userInfo.name + process.env.USERNAME_SALT).digest('hex');
      if (hash !== details.username_sha) {
        return Promise.reject({error: 'invalid_name'});
      }
      return db().collection('mecto').updateOne({_id: userInfo.id}, {$set: {
        name: userInfo.name,
        email: userInfo.email,
        avatarIndex: userInfo.avatarIndex,
        address: userInfo.address,
        network: userInfo.network,
        timestamp: new Date(),
        geometry: {
          type: 'Point',
          coordinates: [lon, lat]
        }}
      }, {upsert: true});
    });
}

function remove(id) {
  if (!id) return Promise.resolve();
  var collection = db().collection('mecto');
  return collection.deleteOne({_id: id});
}

function removeOlderThan(age) {
  var collection = db().collection('mecto');
  var date = new Date();
  date.setMilliseconds(date.getMilliseconds() - age);
  return collection.deleteMany({timestamp: {$lt: date}});
}

function search(lat, lon, userInfo) {
  if (['bitcoin', 'bitcoincash', 'litecoin', 'testnet', 'ethereum', 'ripple'].indexOf(userInfo.network) === -1) {
    return Promise.reject({error: 'unsupported_network'});
  }
  var collection = db().collection('mecto');
  return collection.find({
    _id: {$ne: userInfo.id},
    network: userInfo.network,
    geometry: {
      $nearSphere: {
         $geometry: {
            type: 'Point',
            coordinates: [lon, lat]
         },
         $minDistance: 0,
         $maxDistance: SEARCH_RADIUS
      }
    }
  }).limit(15).toArray().then(function(docs) {
    return docs.map(function(item) {
      return [{
        address: item.address,
        name: item.name,
        email: item.email,
        avatarIndex: item.avatarIndex
      }]
    });
  });
}

module.exports = {
  SEARCH_RADIUS: SEARCH_RADIUS,
  save: save,
  search: search,
  remove: remove,
  removeOlderThan: removeOlderThan
}
