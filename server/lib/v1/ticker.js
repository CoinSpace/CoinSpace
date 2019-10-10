'use strict';

var axios = require('axios');
var db = require('./db');

var fsyms = [
  'BTC',
  'BCH',
  'LTC',
  'ETH',
  'XRP',
  'XLM',
  'EOS',
  'DOGE',
  'DASH',
  'USDT',
  'USD'
]

var tsyms = [
  'AUD', 'BRL', 'CAD', 'CHF', 'CNY',
  'DKK', 'EUR', 'GBP', 'IDR', 'ILS',
  'JPY', 'MXN', 'NOK', 'NZD', 'PLN',
  'RUB', 'SEK', 'SGD', 'TRY', 'UAH',
  'USD', 'ZAR'
]

function save(tickers) {
  var operations = tickers.map(function(ticker) {
    return {updateOne: {filter: {_id: ticker._id}, update: {$set: {data: ticker.data}}, upsert: true}};
  });

  var collection = db().collection('ticker');
  return collection.bulkWrite(operations);
}

function getFromAPI() {
  return axios({
    url: 'https://min-api.cryptocompare.com/data/pricemulti',
    params: {
      fsyms: fsyms.join(),
      tsyms: tsyms.join()
    }
  }).then(function(response) {
    if (!response.data) throw new Error('Bad ticker response');
    return Object.keys(response.data).map(function(key) {
      if (key === 'BTC') {
        response.data[key]['mBTC'] = 1000;
        response.data[key]['μBTC'] = 1000000;
      } else if (key === 'BCH') {
        response.data[key]['mBCH'] = 1000;
        response.data[key]['μBCH'] = 1000000;
      }
      return {
        _id: key,
        data: response.data[key]
      }
    })
  });
}

function getFromCache(symbol) {
  var ticker = db().collection('ticker');
  if (fsyms.includes(symbol)) {
    return ticker
    .find({_id: symbol})
    .limit(1)
    .next()
    .then(function(doc) {
      return doc.data;
    });
  }

  var tokens = db().collection('ethereum_tokens');
  return Promise.all([
    tokens.find({symbol: symbol}).limit(1).next(),
    ticker.find({_id: 'USD'}).limit(1).next()
  ]).then(function(results) {
    var token = results[0];
    var ticker = results[1];
    var data = {};
    tsyms.forEach(function(key) {
      if (!token) {
        return (data[key] = 0);
      }
      data[key] = parseFloat((ticker.data[key] * token.price).toFixed(6));
    });
    return data
  });
}

function getFromCacheForAppleWatch() {
  var ticker = db().collection('ticker');
  var tickers = ['BTC','BCH','LTC','ETH'];
  return ticker
    .find({_id: {$in: tickers}})
    .toArray()
    .then(function(docs) {
      return docs.reduce(function(result, doc) {
        result[doc._id] = doc.data;
        return result;
      }, {});
    });
}

module.exports = {
  save: save,
  getFromAPI: getFromAPI,
  getFromCache: getFromCache,
  getFromCacheForAppleWatch: getFromCacheForAppleWatch
};
