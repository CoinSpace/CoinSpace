'use strict';

var PouchDB = require('pouchdb').default
var db = new PouchDB('cs-local')

var credentials = "credentials"

function saveEncrypedSeed(id, encryptedSeed, callback) {
  db.get(credentials, function(err, doc){
    if(doc) {
      return db.remove(doc, function(err){
        if(err) return callback(err);

        saveEncrypedSeed(id, encryptedSeed, callback)
      })
    }

    doc = {
      _id: credentials,
      id: id,
      seed: encryptedSeed
    }
    db.put(doc, callback)
  })
}

function getCredentials(callback) {
  db.get(credentials, callback)
}

function deleteCredentials(doc, callback) {
  db.remove(doc, function(err){
    if(err) console.error('failed to delete credentials');
    return callback(err)
  })
}

function getPendingTxs(callback){
  db.get('pendingTxs', function(err, doc){
    if(err) {
      if(err.status === 404) {
        return callback(null, [])
      }
      return callback(err);
    }

    callback(null, doc.txs)
  })
}

function setPendingTxs(txs, callback) {
  savePendingTx(txs, function(doc){
    doc.txs = txs
  }, callback)
}

function addPendingTx(tx, callback) {
  savePendingTx(tx, function(doc){
    doc.txs.push(tx)
  }, callback)
}

function savePendingTx(tx, processDoc, callback) {
  db.get('pendingTxs', function(err, doc){
    if(err) {
      if(err.status === 404) {
        return db.put({
          _id: 'pendingTxs',
          txs: [].concat(tx)
        }, callback)
      }

      return callback(err)
    }

    processDoc(doc)
    db.put(doc, callback)
  })
}


module.exports = {
  saveEncrypedSeed: saveEncrypedSeed,
  getCredentials: getCredentials,
  deleteCredentials: deleteCredentials,
  getPendingTxs: getPendingTxs,
  setPendingTxs: setPendingTxs,
  addPendingTx: addPendingTx
}
