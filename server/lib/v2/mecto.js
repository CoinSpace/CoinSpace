import createError from 'http-errors';
import crypto from 'crypto';
import db from '../db.js';

const SEARCH_RADIUS = 1000;
const SEARCH_LIMIT = 15;
const COLLECTION = 'mecto';

async function search(device, query) {
  const { lon, lat } = query;
  const collection = db.collection(COLLECTION);

  const docs = await collection.find({
    _id: { $ne: device._id },
    version: 2,
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
  }).limit(SEARCH_LIMIT).toArray();

  return docs.map((item) => {
    return {
      address: item.address,
      username: item.username,
      email: item.email,
      avatarIndex: item.avatarIndex,
    };
  });
}

async function save(device, body) {
  const { username, email, avatarIndex, address, lat, lon } = body;
  const hash = crypto.createHash('sha1').update(username + process.env.USERNAME_SALT).digest('hex');
  if (hash !== device.wallet.username_sha) {
    throw createError(400, 'Invalid username');
  }

  await db.collection(COLLECTION).updateOne({ _id: device._id }, { $set: {
    username,
    email,
    avatarIndex,
    address,
    timestamp: new Date(),
    version: 2,
    geometry: {
      type: 'Point',
      coordinates: [lon, lat],
    } },
  }, { upsert: true });

  return true;
}

async function remove(device) {
  const res = await db.collection(COLLECTION).deleteOne({ _id: device._id });
  if (res.deletedCount !== 1) {
    throw createError(404, 'Unknown mecto');
  }
}

export default {
  search,
  save,
  remove,
};
