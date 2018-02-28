var axios = require('axios');
var db = require('./db');
var crypto = require('crypto');
var currencies = require('cs-ticker-api/currencies');

var tickerUrl = 'https://apiv2.bitcoinaverage.com/indices/global/ticker/short';
var networks = {
  BTC: 'bitcoin',
  BCH: 'bitcoincash',
  LTC: 'litecoin',
  ETH: 'ethereum'
};

function save(cacheId, data) {
  var collection = db().collection('ticker');
  return collection.replaceOne({_id: cacheId}, {data: data}, {upsert: true});
}

function getFromAPI(cryptoTicker) {
  return axios({
    url: tickerUrl,
    headers: {'X-Signature': getSignature()},
    params: {
      crypto: cryptoTicker,
      fiat: getCurrencies(cryptoTicker).join()
    }
  }).then(function(response) {
    if (!response.data) throw new Error('Bad ticker response');
    return toRates(response.data, cryptoTicker);
  });
}

function getFromCache(cacheId) {
  var collection = db().collection('ticker');
  return collection
    .find({_id: cacheId})
    .limit(1)
    .next()
    .then(function(doc) {
      return doc.data;
    });
}

function toRates(apiRates, cryptoTicker){
  var rates = {};
  var ignored = ['mBTC', 'μBTC', 'mBCH', 'μBCH'];
  getCurrencies(cryptoTicker).forEach(function(currency){
    if (ignored.indexOf(currency) !== -1) return;
    rates[currency] = apiRates[cryptoTicker + currency].last
  });
  if (cryptoTicker === 'BTC') {
    rates['mBTC'] = 1000;
    rates['μBTC'] = 1000000;
  } else if (cryptoTicker === 'BCH') {
    rates['mBCH'] = 1000;
    rates['μBCH'] = 1000000;
  }
  return rates;
}

function getSignature() {
  var publicKey = process.env.BITCOINAVERAGE_API_KEY
  var secretKey = process.env.BITCOINAVERAGE_API_SECRET
  var timestamp = Math.floor(Date.now() / 1000)
  var payload = timestamp + '.' + publicKey
  var hexHash = crypto.createHmac('sha256', secretKey).update(payload).digest('hex')
  return payload + '.' + hexHash
}

function getCurrencies(cryptoTicker) {
  if (!networks[cryptoTicker]) {
    throw new Error(cryptoTicker + ' currency ticker is not supported');
  }
  return currencies(networks[cryptoTicker]);
}

module.exports = {
  save: save,
  getFromAPI: getFromAPI,
  getFromCache: getFromCache
};
