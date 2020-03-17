'use strict';

var axios = require('axios');
var db = require('./db');
var API_KEY = process.env.MOONPAY_API_KEY;

var PRIORITY_SYMBOLS = ['BTC', 'BCH', 'BSV', 'ETH', 'USDT', 'LTC', 'XRP', 'XLM', 'EOS', 'DOGE', 'DASH'];
var fiatSigns = {
  aud: '$',
  cad: '$',
  usd: '$',
  eur: '€',
  gbp: '£',
  zar: 'R'
};

function save(_id, data) {
  var collection = db().collection('moonpay');
  return collection.updateOne({_id: _id}, {$set: {data: data}}, {upsert: true});
}

function getCurrenciesFromAPI() {
  return axios.get('https://api.moonpay.io/v3/currencies', {
    params: {
      apiKey: API_KEY
    }
  }).then(function(response) {
    var data = response.data;
    if (!data || !data.length) throw new Error('Bad moonpay response');

    var coins = {};
    var coinsUSA = {};
    PRIORITY_SYMBOLS.forEach(function(symbol) {
      var coin = data.find(function(item) {
        return item.code === symbol.toLowerCase();
      });
      if (coin) {
        coins[coin.id] = {
          symbol: symbol,
          isSupported: !coin.isSuspended
        }
        coinsUSA[coin.id] = {
          symbol: symbol,
          isSupported: !coin.isSuspended && coin.isSupportedInUS
        }
      }
    });

    var fiat = {};
    data.forEach(function(item) {
      if (item.type === 'fiat') {
        fiat[item.id] = {
          symbol: item.code.toUpperCase(),
          sign: fiatSigns[item.code] || '',
          precision: item.precision,
          minAmount: item.minAmount || 20
        };
      }
    });

    return {
      coins: coins,
      coins_usa: coinsUSA,
      fiat: fiat
    };
  });
}

function getCountriesFromAPI() {
  return axios.get('https://api.moonpay.io/v3/countries').then(function(response) {
    var data = response.data;
    if (!data || !data.length) throw new Error('Bad moonpay response');

    var document = data.filter(function(country) {
      return country.supportedDocuments && country.supportedDocuments.length > 0;
    }).map(function(country) {
      return {
        code: country.alpha3,
        name: country.name,
        supportedDocuments: country.supportedDocuments
      }
    });

    var allowed = data.filter(function(country) {
      return country.isAllowed;
    }).map(function(country) {
      var item = {};
      item.code = country.alpha3;
      item.name = country.name;
      if (country.states) {
        item.states = country.states.filter(function(state) {
          return state.isAllowed;
        }).map(function(state) {
          return {
            code: state.code,
            name: state.name
          };
        });
      }
      return item;
    });

    return {
      document: document,
      allowed: allowed
    };
  });
}

function getFromCache(id) {
  var collection = db().collection('moonpay');
  return collection
    .find({_id: id})
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
  getCountriesFromAPI: getCountriesFromAPI,
  getFromCache: getFromCache
};
