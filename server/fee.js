var request = require('request')
var db = require('./db')
var feeDB = db('fee')
var cacheId = 'bitcoinfees.21.co'

function save(data) {
  feeDB.save(cacheId, data, function(err) {
    if (err) return console.error('FATAL: failed to save fee doc');
  });
}

function getFromAPI(callback) {
  request({
    uri: 'https://bitcoinfees.21.co/api/v1/fees/recommended',
    json: true
  }, function(error, response, body) {
    if (error || !response || response.statusCode !== 200) {
      return callback({error: error, status: response ? response.statusCode : 'empty response'})
    }
    callback(null, body);
  })
}

function getFromCache(callback) {
  feeDB.get(cacheId, function(err, doc) {
    if (err) return callback(err);
    callback(null, doc);
  })
}

module.exports = {
  save: save,
  getFromAPI: getFromAPI,
  getFromCache: getFromCache
}
