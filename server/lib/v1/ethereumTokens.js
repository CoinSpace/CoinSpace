'use strict';

var axios = require('axios');
var db = require('./db');
var limit = 50;

function save(tokens) {
  var operations = tokens.map(function(token) {
    return {replaceOne: {filter: {_id: token._id}, replacement: token, upsert: true}};
  });

  var collection = db().collection('ethereum_tokens');
  return Promise.all([
    collection.bulkWrite(operations),
    collection.deleteMany({_id: { $gte: tokens.length }})
  ]);
}

function getFromAPI() {
  return axios({
    url: 'https://api.ethplorer.io/getTop',
    params: {
      apiKey: process.env.ETHPLORER_API_KEY,
      criteria: 'cap',
      limit: limit
    }
  }).then(function(response) {
    if (!response.data) throw new Error('Bad ethereumTokens response');
    var rank = 0;
    return response.data.tokens.filter(function(token) {
      if (token.symbol === 'ETH') return false;
      if (token.symbol === 'USDT') return false;
      return true;
    }).map(function(item) {
      return {
        _id: rank++,
        address: item.address,
        name: item.name,
        decimals: parseInt(item.decimals),
        symbol: item.symbol,
        price: item.price ? parseFloat(item.price.rate) : 0.0,
      }
    });
  });
}

function getAllFromCache() {
  var collection = db().collection('ethereum_tokens');
  return collection
    .find({}, {projection: {_id: 0}})
    .sort({symbol: 1})
    .limit(limit)
    .toArray();
}

module.exports = {
  save: save,
  getFromAPI: getFromAPI,
  getAllFromCache: getAllFromCache
};
