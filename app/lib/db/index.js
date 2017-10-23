'use strict';

var emitter = require('lib/emitter')
var PouchDB = require('pouchdb').default
var merge = require('lodash.merge');
var AES = require('lib/aes')
var randAvatarIndex = require('lib/avatar').randAvatarIndex
var encrypt = AES.encrypt
var decrypt = AES.decrypt

var db = new PouchDB('cs')
var remote = null
var id = null
var sercret = null
var isReady = false

function set(key, value, callback) {
  updateDoc(callback, function(data){
    if(data[key] && value != undefined) {
      merge(data[key], value)
    } else {
      data[key] = value
    }
  })
}

function updateDoc(callback, processData) {
  if(id == null) return callback(new Error('wallet not ready'));

  db.get(id, function(err, doc){
    var data = JSON.parse(decrypt(doc.data, sercret))
    processData(data)

    doc.data = encrypt(JSON.stringify(data), sercret)
    db.put(doc, callback)

    PouchDB.replicate(db, remote, {doc_ids: [id]}).on('error', function(error) {
      console.error('failed to replicate changes to server', error)
    })
  })
}

function get(key, callback) {
  if(id == null) return callback(new Error('wallet not ready'));

  if(key instanceof Function){
    callback = key
    key = null
  }

  db.get(id, function(err, doc){
    if(err) return callback(err)

    var data = JSON.parse(decrypt(doc.data, sercret))
    var value = data[key]
    if(!key){
      value = data
    }
    callback(null, value)
  })
}

function remove(callback) {
  db.get(id, function(err, doc) {
    if (err) return console.error(err);
    db.remove(doc, callback);
  });
}

emitter.on('wallet-init', function(data){
  sercret = data.seed
  id = data.id
})

emitter.on('wallet-auth', function(data){
  remote = getRemote(data)

  db.get(id, function(err){
    if(err) {
      if(err.status === 404) {
        return firstTimePull()
      }
      return console.error(err)
    }

    isReady = true
    emitter.emit('db-ready')
    PouchDB.replicate(db, remote, {doc_ids: [id]}).on('error', function(error) {
      console.error('failed to replicate changes to server', error)
    })
  })
})

function getRemote(data){
  var scheme = process.env.DB_PORT === '443' ? 'https' : 'http'
  var url = [
    scheme, '://',
    id, ':', data.token, data.pin,
    '@', process.env.DB_HOST
  ]
  if (process.env.DB_PORT !== '443') {
   url = url.concat([':', process.env.DB_PORT])
  }
  url = url.concat(['/cs', id]).join('')
  return new PouchDB(url)
}

function firstTimePull() {
  PouchDB.replicate(remote, db, {doc_ids: [id]}).on('complete', function() {
    db.get(id, function(err){
      if(err) {
        if(err.status === 404) return initializeRecord();
        return console.error(err)
      }
      isReady = true
      emitter.emit('db-ready')
    })
  })
}

function initializeRecord(){
  var defaultValue = {
    systemInfo: { preferredCurrency: 'USD' },
    userInfo: {
      firstName: '',
      lastName: '',
      email: '',
      avatarIndex: randAvatarIndex()
    }
  }

  var doc = {
    _id: id,
    data: encrypt(JSON.stringify(defaultValue), sercret)
  }

  db.put(doc, function(err){
    if(err) return console.error(err);

    isReady = true
    emitter.emit('db-ready')
  })
}

module.exports = {
  get: get,
  set: set,
  remove: remove,
  isReady: function() {
    return isReady;
  }
}

