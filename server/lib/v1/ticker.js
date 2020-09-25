'use strict';

const axios = require('axios');
const db = require('./db');

const fsyms = [
  'BTC',
  'BCH',
  'BSV',
  'LTC',
  'ETH',
  'XRP',
  'XLM',
  'EOS',
  'DOGE',
  'DASH',
  'USDT',
  'USD',
];

const tsyms = [
  'AUD', 'BRL', 'CAD', 'CHF', 'CNY',
  'DKK', 'EUR', 'GBP', 'IDR', 'ILS',
  'JPY', 'MXN', 'NOK', 'NZD', 'PLN',
  'RUB', 'SEK', 'SGD', 'TRY', 'UAH',
  'USD', 'ZAR',
];

function save(tickers) {
  const operations = tickers.map((ticker) => {
    return { updateOne: { filter: { _id: ticker._id }, update: { $set: { data: ticker.data } }, upsert: true } };
  });

  const collection = db().collection('ticker');
  return collection.bulkWrite(operations);
}

function getFromAPI() {
  return axios({
    url: 'https://min-api.cryptocompare.com/data/pricemulti',
    params: {
      fsyms: fsyms.join(),
      tsyms: tsyms.join(),
    },
  }).then((response) => {
    if (!response.data) throw new Error('Bad ticker response');
    return Object.keys(response.data).map((key) => {
      if (key === 'BTC') {
        response.data[key]['mBTC'] = 1000;
        response.data[key]['μBTC'] = 1000000;
      } else if (key === 'BCH') {
        response.data[key]['mBCH'] = 1000;
        response.data[key]['μBCH'] = 1000000;
      } else if (key === 'BSV') {
        response.data[key]['mBSV'] = 1000;
        response.data[key]['μBSV'] = 1000000;
      }
      return {
        _id: key,
        data: response.data[key],
      };
    });
  });
}

function getFromCache(symbol) {
  const ticker = db().collection('ticker');
  if (fsyms.includes(symbol)) {
    return ticker
      .find({ _id: symbol })
      .limit(1)
      .next()
      .then((doc) => {
        return doc.data;
      });
  }

  const tokens = db().collection('ethereum_tokens');
  return Promise.all([
    tokens.find({ symbol }).limit(1).next(),
    ticker.find({ _id: 'USD' }).limit(1).next(),
  ]).then((results) => {
    const token = results[0];
    const ticker = results[1];
    const data = {};
    tsyms.forEach((key) => {
      if (!token) {
        return (data[key] = 0);
      }
      data[key] = parseFloat((ticker.data[key] * token.price).toFixed(6));
    });
    return data;
  });
}

function getFromCacheForAppleWatch() {
  const ticker = db().collection('ticker');
  const tickers = ['BTC', 'BCH', 'LTC', 'ETH'];
  return ticker
    .find({ _id: { $in: tickers } })
    .toArray()
    .then((docs) => {
      return docs.reduce((result, doc) => {
        result[doc._id] = doc.data;
        return result;
      }, {});
    });
}

module.exports = {
  save,
  getFromAPI,
  getFromCache,
  getFromCacheForAppleWatch,
};
