'use strict';

const db = require('../v1/db');

const COLLECTION = 'cache';

async function getCache(device, cacheName) {
  const id = `${device.wallet._id}_${cacheName}`;
  const doc = await db().collection(COLLECTION)
    .findOne({ _id: id });
  return doc && doc.cache.buffer.toString('base64');
}

async function setCache(device, cacheName, cache) {
  const id = `${device.wallet._id}_${cacheName}`;
  await db().collection(COLLECTION)
    .updateOne({ _id: id }, { $set: { cache: Buffer.from(cache, 'base64') } }, { upsert: true });
  return cache;
}

module.exports = {
  getCache,
  setCache,
};
