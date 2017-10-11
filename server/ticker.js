var axios = require('axios')
var db = require('./db')
var tickerDB = db('ticker')
var crypto = require('crypto')
var currencies = require('cs-ticker-api/currencies')

var tickerUrl = 'https://apiv2.bitcoinaverage.com/indices/global/ticker/short'

function save(cacheId, data) {
  tickerDB.save(cacheId, {data: data}, function(err) {
    if (err) return console.error('FATAL: failed to save ticker doc');
  });
}

function getFromAPI(cryptoTicker, callback) {
  axios({
    url: tickerUrl,
    headers: {'X-Signature': getSignature()},
    params: {
      crypto: cryptoTicker,
      fiat: currencies.join()
    }
  }).then(function(response) {
    return callback(null, toRates(response.data, cryptoTicker));
  }).catch(callback)
}

function getFromCache(cacheId, callback) {
  tickerDB.get(cacheId, function(err, doc) {
    if (err) return callback(err);
    callback(null, doc.data);
  })
}

function toRates(apiRates, cryptoTicker){
  var rates = {}
  currencies.forEach(function(currency){
    rates[currency] = apiRates[cryptoTicker + currency].last
  })
  return rates
}

function getSignature() {
  var publicKey = process.env.BITCOINAVERAGE_API_KEY
  var secretKey = process.env.BITCOINAVERAGE_API_SECRET
  var timestamp = Math.floor(Date.now() / 1000)
  var payload = timestamp + '.' + publicKey
  var hexHash = crypto.createHmac('sha256', secretKey).update(payload).digest('hex')
  return payload + '.' + hexHash
}

module.exports = {
  save: save,
  getFromAPI: getFromAPI,
  getFromCache: getFromCache
}
