import db from '../db.js';

const COLLECTION = 'storage';

async function getStorage(device, storageName) {
  const id = `${device.wallet._id}_${storageName}`;
  const doc = await db.collection(COLLECTION)
    .findOne({ _id: id });
  return doc && doc.storage.buffer.toString('base64');
}

async function setStorage(device, storageName, storage) {
  const id = `${device.wallet._id}_${storageName}`;
  await db.collection(COLLECTION)
    .updateOne({ _id: id }, { $set: { storage: Buffer.from(storage, 'base64') } }, { upsert: true });
  return storage;
}

export default {
  getStorage,
  setStorage,
};
