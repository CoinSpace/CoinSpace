'use strict';

var axios = require('axios')
var db = require('./db')
var networks = [
  'bitcoin',
  'bitcoincash',
  'litecoin',
  'testnet'
];

function save(network, data) {
  if (network !== 'bitcoin') throw new Error(network + ' currency fee is not supported');
  var collection = db().collection('fee');
  return collection.updateOne({_id: network}, {$set: {
    minimum: data.minimum,
    hour: data.hour,
    fastest: data.fastest
  }}, {upsert: true});
}

function getFromAPI(network) {
  if (network !== 'bitcoin') throw new Error(network + ' currency fee is not supported');
  return axios.get('https://bitcoinfees.earn.com/api/v1/fees/recommended').then(function(response) {
    var data = response.data;
    if (!data.fastestFee || !data.hourFee) throw new Error('Bad fee response');
    var min = 10;
    response.data.minimum = Math.max(Math.ceil(response.data.hourFee / 2), min)
    response.data.hourFee = Math.max(response.data.hourFee, min)
    response.data.fastestFee = Math.max(response.data.fastestFee, min)
    return response.data;
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
