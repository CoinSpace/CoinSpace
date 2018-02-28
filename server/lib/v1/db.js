'use strict';

var MongoClient = require('mongodb').MongoClient;
var db;

module.exports = function() {
  if (db) { return db; }

  return MongoClient.connect(process.env.DB_CONNECT)
    .then(function(client) {
      db = client.db(process.env.DB_NAME);
      return Promise.all([
        db.collection('mecto').createIndexes([
          {key: {geometry: '2dsphere'}, background: true},
          {key: {network: 1}, background: true},
        ])
      ]);
    });
};
