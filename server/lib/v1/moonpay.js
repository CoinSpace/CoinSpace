import db from '../db.js';

function save(_id, data) {
  const collection = db.collection('moonpay');
  return collection.updateOne({ _id }, { $set: { data } }, { upsert: true });
}

function getFromCache(id) {
  const collection = db.collection('moonpay');
  return collection
    .find({ _id: id })
    .limit(1)
    .next().then((item) => {
      if (!item) return {};
      delete item.id;
      return item.data;
    });
}

export default {
  save,
  getFromCache,
};
