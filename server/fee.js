var axios = require('axios')
var db = require('./db')
var feeDB = db('fee')
var cacheId = 'bitcoinfees.21.co'

function save(data) {
  feeDB.save(cacheId, data, function(err) {
    if (err) return console.error('FATAL: failed to save fee doc');
  });
}

function getFromAPI() {
  return axios.get('https://bitcoinfees.21.co/api/v1/fees/recommended').then(function(response) {
    var data = response.data;
    if (!data.hourFee || !data.fastestFee) throw new Error('Bad fee response');
    return response.data;
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
