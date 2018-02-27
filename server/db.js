"use strict"

var MongoClient = require('mongodb').MongoClient;
var db;

module.exports = function() {
  if (db) { return db; }

  return MongoClient.connect(process.env.DB_CONNECT)
    .then(function(client) {
      db = client.db(process.env.DB_NAME);
    });
};
