'use strict';

var axios = require('axios');
var db = require('./db');

var PRIORITY_SYMBOLS = ['BTC', 'BCH', 'ETH', 'USDT', 'LTC', 'XRP', 'XLM', 'EOS', 'DOGE', 'DASH'];
var fiatSigns = {
  usd: '$',
  eur: '€',
  gbp: '£'
};

function save(_id, data) {
  var collection = db().collection('moonpay');
  return collection.updateOne({_id: _id}, {$set: {data: data}}, {upsert: true});
}

function getCurrenciesFromAPI() {
  return axios.get('https://api.moonpay.io/v3/currencies').then(function(response) {
    var data = response.data;
    if (!data || !data.length) throw new Error('Bad moonpay response');

    var coins = {any: {}, USA: {}};
    PRIORITY_SYMBOLS.forEach(function(symbol) {
      var coin = data.find(function(item) {
        return item.code === symbol.toLowerCase() && !item.isSuspended;
      });
      if (coin) {
        coins.any[symbol] = true;
        if (coin.isSupportedInUS) coins.USA[symbol] = true;
      }
    });

    var fiat = {};
    data.forEach(function(item) {
      if (item.type === 'fiat') {
        fiat[item.id] = {
          symbol: item.code.toUpperCase(),
          sign: fiatSigns[item.code] || ''
        };
      }
    });

    return {
      coins: coins,
      fiat: fiat
    };
  });
}

function getCoinsFromCache(country) {
  var collection = db().collection('moonpay');
  return collection
    .find({_id: 'coins'})
    .limit(1)
    .next().then(function(item) {
      if (!item) return {};
      delete item.id;
      if (country === 'USA') return item.data.USA;
      return item.data.any;
    });
}

function getFiatFromCache() {
  var collection = db().collection('moonpay');
  return collection
    .find({_id: 'fiat'})
    .limit(1)
    .next().then(function(item) {
      if (!item) return {};
      delete item.id;
      return item.data;
    });
}

module.exports = {
  save: save,
  getCurrenciesFromAPI: getCurrenciesFromAPI,
  getCoinsFromCache: getCoinsFromCache,
  getFiatFromCache: getFiatFromCache
};
