'use strict';

const { MongoClient } = require('mongodb');
let db;

module.exports = function() {
  if (db) { return db; }

  return MongoClient.connect(process.env.DB_CONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then((client) => {
      db = client.db(process.env.DB_NAME);
      return Promise.all([
        db.collection('mecto').createIndexes([
          { key: { geometry: '2dsphere' }, background: true },
          { key: { network: 1 }, background: true },
          { key: { version: 1 }, background: true },
          { key: { timestamp: 1 }, background: true, expireAfterSeconds: 60 * 60 }, // 1 hour
        ]),
        db.collection('tokens').createIndexes([
          { key: { symbol: 1 }, background: true },
          { key: { network: 1 }, background: true },
        ]),
        db.collection('details').createIndexes([
          { key: { username_sha: 1 }, background: true, unique: true, sparse: true },
        ]),
        db.collection('wallets').createIndexes([
          { key: { username_sha: 1 }, background: true, unique: true, sparse: true },
          { key: { 'devices._id': 1 }, background: true, unique: true, sparse: true },
        ]),
        db.collection('releases').createIndexes([
          {
            key: {
              distribution: 1,
              arch: 1,
              app: 1,
            },
            background: true,
            unique: true,
          },
        ]),
      ]);
    });
};
