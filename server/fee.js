var axios = require('axios')
var db = require('./db')
var feeDB = db('fee')
var networks = [
  'bitcoin',
  'bitcoincash',
  'litecoin',
  'ethereum',
  'testnet'
];

function save(network, data) {
  if (network !== 'bitcoin') throw new Error(network + ' currency fee is not supported');
  feeDB.save(network, data, function(err) {
    if (err) return console.error('FATAL: failed to save fee doc');
  });
}

function getFromAPI(network) {
  if (network !== 'bitcoin') throw new Error(network + ' currency fee is not supported');
  return axios.get('https://bitcoinfees.earn.com/api/v1/fees/recommended').then(function(response) {
    var data = response.data;
    if (!data.fastestFee || !data.hourFee) throw new Error('Bad fee response');
    response.data.minimum = Math.max(Math.ceil(response.data.hourFee / 2), 10)
    return response.data;
  })
}

function getFromCache(network, callback) {
  if (networks.indexOf(network) === -1) {
    return callback({error: 'Currency fee is not supported'});
  }
  feeDB.get(network, function(err, doc) {
    if (err) return callback(err);
    delete doc._id;
    delete doc._rev;
    callback(null, doc);
  })
}

module.exports = {
  save: save,
  getFromAPI: getFromAPI,
  getFromCache: getFromCache
}
