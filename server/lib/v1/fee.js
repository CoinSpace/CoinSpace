'use strict';

var axios = require('axios')
var db = require('./db')
var networks = [
  'bitcoin',
  'bitcoincash',
  'bitcoinsv',
  'litecoin',
  'dogecoin',
  'dash'
];

function save(network, data) {
  if (network !== 'bitcoin') throw new Error(network + ' currency fee is not supported');
  var collection = db().collection('fee');
  return collection.updateOne({_id: network}, {$set: {
    items: [
      {name: 'minimum', value: data.minimum},
      {name: 'hour', value: data.hour, default: true},
      {name: 'fastest', value: data.fastest},
    ]
  }}, {upsert: true});
}

function getFromAPI(network) {
  if (network !== 'bitcoin') throw new Error(network + ' currency fee is not supported');
  return axios.get('https://bitcoinfees.earn.com/api/v1/fees/recommended').then(function(response) {
    var data = response.data;
    if (!data.fastestFee || !data.hourFee) throw new Error('Bad fee response');
    var min = 10;
    var minimum = Math.max(Math.ceil(data.hourFee / 2), min);
    var hourFee = Math.max(data.hourFee, min);
    var fastestFee = Math.max(data.fastestFee, min);
    if (hourFee <= minimum) hourFee = minimum + 1;
    if (fastestFee <= hourFee) fastestFee = hourFee + 1;
    return { minimum, hourFee, fastestFee};
  })
}

function getFromCache(network) {
  if (networks.indexOf(network) === -1) {
    return Promise.reject({error: 'Currency fee is not supported'});
  }
  var collection = db().collection('fee');
  return collection
    .find({_id: network})
    .limit(1)
    .next();
}

module.exports = {
  save: save,
  getFromAPI: getFromAPI,
  getFromCache: getFromCache
}
