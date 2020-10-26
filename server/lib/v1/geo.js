'use strict';

const db = require('./db');
const crypto = require('crypto');
const SEARCH_RADIUS = 1000;

function save(lat, lon, userInfo) {
  return db().collection('details')
    .find({ _id: userInfo.id }, { projection: { username_sha: 1 } })
    .limit(1)
    .next().then((details) => {
      if (!details) return Promise.reject({ error: 'details_not_found' });
      const hash = crypto.createHash('sha1')
        .update(userInfo.name + process.env.USERNAME_SALT)
        .digest('hex');
      if (hash !== details.username_sha) {
        return Promise.reject({ error: 'invalid_name' });
      }
      return db().collection('mecto').updateOne({ _id: userInfo.id }, { $set: {
        name: userInfo.name,
        email: userInfo.email,
        avatarIndex: userInfo.avatarIndex,
        address: userInfo.address,
        network: userInfo.network,
        timestamp: new Date(),
        version: 1,
        geometry: {
          type: 'Point',
          coordinates: [lon, lat],
        } },
      }, { upsert: true });
    });
}

function remove(id) {
  if (!id) return Promise.resolve();
  const collection = db().collection('mecto');
  return collection.deleteOne({ _id: id });
}

function search(lat, lon, userInfo) {
  // eslint-disable-next-line max-len
  if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash', 'ethereum', 'ripple', 'stellar', 'eos'].indexOf(userInfo.network) === -1) {
    return Promise.reject({ error: 'unsupported_network' });
  }
  const collection = db().collection('mecto');
  return collection.find({
    _id: { $ne: userInfo.id },
    network: userInfo.network,
    version: 1,
    geometry: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [lon, lat],
        },
        $minDistance: 0,
        $maxDistance: SEARCH_RADIUS,
      },
    },
  }).limit(15).toArray().then((docs) => {
    return docs.map((item) => {
      return [{
        address: item.address,
        name: item.name,
        email: item.email,
        avatarIndex: item.avatarIndex,
      }];
    });
  });
}

module.exports = {
  SEARCH_RADIUS,
  save,
  search,
  remove,
};
