var axios = require('axios');
var db = require('./db');
var limit = 100;

function save(tokens) {
  var operations = tokens.map(function(token) {
    return {replaceOne: {filter: {_id: token._id}, replacement: token, upsert: true}};
  });

  var collection = db().collection('ethereum_tokens');
  return collection.bulkWrite(operations)
    .then(function() {
      return true;
    });
}

function getFromAPI() {
  return axios({
    url: 'https://api.ethplorer.io/getTop',
    params: {
      apiKey: 'freekey',
      criteria: 'cap',
      limit: limit
    }
  }).then(function(response) {
    if (!response.data) throw new Error('Bad ethereumTokens response');
    response.data.tokens.shift();
    var rank = 0;
    return response.data.tokens.map(function(item) {
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
