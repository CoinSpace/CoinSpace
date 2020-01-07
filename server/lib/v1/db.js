'use strict';

var MongoClient = require('mongodb').MongoClient;
var db;

module.exports = function() {
  if (db) { return db; }

  return MongoClient.connect(process.env.DB_CONNECT, {useNewUrlParser: true, useUnifiedTopology: true })
    .then(function(client) {
      db = client.db(process.env.DB_NAME);
      db.on('close', function() {
        console.log('MongoDB has been closed.');
        process.exit(1);
      });
      return Promise.all([
        db.collection('mecto').createIndexes([
          {key: {geometry: '2dsphere'}, background: true},
          {key: {network: 1}, background: true},
        ]),
        db.collection('ethereum_tokens').createIndexes([
          {key: {symbol: 1}, background: true},
        ]),
        db.collection('details').createIndexes([
          {key: {username_sha: 1}, background: true, unique: true, sparse: true},
        ])
      ]);
    });
};
