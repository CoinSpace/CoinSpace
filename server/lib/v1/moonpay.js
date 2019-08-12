'use strict';

var axios = require('axios');
var db = require('./db');

var PRIORITY_SYMBOLS = ['BTC', 'BCH', 'ETH', 'LTC', 'XRP', 'XLM', 'EOS', 'DOGE', 'DASH'];

function save(_id, data) {
  var collection = db().collection('moonpay');
  return collection.updateOne({_id: _id}, {$set: {data: data}}, {upsert: true});
}

function getCoinsFromAPI() {
  return axios.get('https://api.moonpay.io/v2/currencies').then(function(response) {
    var data = response.data;
    if (!data || !data.length) throw new Error('Bad moonpay response');

    var result = {};
    PRIORITY_SYMBOLS.forEach(function(symbol) {
      var coin = data.find(function(item) {
        return item.code === symbol.toLowerCase() && !item.isSuspended;
      });
      result[symbol] = !!coin;
    });
    return result;
  });
}

function getCoinsFromCache() {
  var collection = db().collection('moonpay');
  return collection
    .find({_id: 'coins'})
    .limit(1)
    .next().then(function(item) {
      if (!item) return {};
      delete item.id;
      return item.data;
    });
}

module.exports = {
  save: save,
  getCoinsFromAPI: getCoinsFromAPI,
  getCoinsFromCache: getCoinsFromCache
};
