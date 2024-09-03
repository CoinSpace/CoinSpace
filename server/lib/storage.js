import db from './db.js';

const COLLECTION = 'storage';

async function getStorage(device, storageName) {
  const id = `${device.wallet._id}_${storageName}`;
  const doc = await db.collection(COLLECTION)
    .findOne({ _id: id });
  return doc && doc.storage.buffer.toString('base64');
}

async function getStorages(device, storageNames) {
  storageNames = storageNames.split(',');
  const ids = storageNames.map((storageName) => {
    return `${device.wallet._id}_${storageName}`;
  });
  const docs = await db.collection(COLLECTION)
    .find({ _id: { $in: ids } })
    .toArray();
  return docs.map((doc) => {
    return {
      _id: doc._id.replace(`${device.wallet._id}_`, ''),
      data: doc.storage.buffer.toString('base64'),
    };
  });
}

async function setStorage(device, storageName, storage) {
  const id = `${device.wallet._id}_${storageName}`;
  await db.collection(COLLECTION)
    .updateOne({ _id: id }, { $set: { storage: Buffer.from(storage, 'base64') } }, { upsert: true });
  return storage;
}

function fixStorageName(storageName) {
  if (storageName === 'monero') return 'monero@monero';
  if (storageName === 'eos') return 'eos@eos';
  return storageName;
}

export default {
  getStorage,
  getStorages,
  setStorage,
  fixStorageName,
};
