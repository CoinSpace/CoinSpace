import createError from 'http-errors';
import crypto from 'crypto';
import db from './db.js';

const SEARCH_RADIUS = 1000;
const SEARCH_LIMIT = 15;
const COLLECTION = 'mecto';

async function search(device, query, legacy = false) {
  const { lon, lat } = query;
  const collection = db.collection(COLLECTION);

  const docs = await collection.find({
    _id: { $ne: device._id },
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

  return docs.map(({ address, username, avatarId }) => {
    if (legacy) {
      return { address, username, email: '', avatarIndex: 1 };
    }
    return { address, username, avatarId };
  });
}

async function save(device, body, legacy = false) {
  const { username, email, avatarIndex, address, lat, lon } = body;
  let { avatarId } = body;
  const hash = crypto.createHash('sha1').update(username + process.env.USERNAME_SALT).digest('hex');
  if (hash !== device.wallet.username_sha) {
    throw createError(400, 'Invalid username');
  }
  if (legacy) {
    if (email) {
      const hash = crypto.createHash('md5').update(email).digest('hex');
      avatarId = `gravatar:${hash}`;
    } else {
      const hash = crypto.createHash('sha1').update(`${username}${email}${avatarIndex}`).digest('hex');
      avatarId = `identicon:${hash}`;
    }
  }
  await db.collection(COLLECTION).updateOne({ _id: device._id }, { $set: {
    username,
    avatarId,
    address,
    timestamp: new Date(),
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
