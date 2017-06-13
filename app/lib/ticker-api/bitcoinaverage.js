'use strict';

var xhr = require('xhr')
var currencies = require('./currencies')

var tickers = {
  bitcoin: 'BTC',
  testnet: 'BTC',
  litecoin: 'LTC'
}

var network = null

function BitcoinAverage(n){
  network = n
  if(!tickers[network]) {
    throw new Error(network + " price ticker is not supported")
  }
}
BitcoinAverage.apiRoot = "https://apiv2.bitcoinaverage.com/indices/global/ticker/short?crypto="

function getExchangeRates(callback){
  var ticker = tickers[network]
  var uri = BitcoinAverage.apiRoot + ticker
  xhr({
    uri: uri,
    timeout: 10000,
    method: 'GET'
  }, function(err, resp, body){
    if(resp.statusCode !== 200) {
      console.error(body)
      return callback(err)
    }

    callback(null, toRates(JSON.parse(body), ticker))
  })
}

function toRates(apiRates, ticker){
  var rates = {}
  currencies.forEach(function(currency){
    rates[currency] = apiRates[ticker + currency].last
  })
  return rates
}

BitcoinAverage.prototype.getExchangeRates = getExchangeRates
module.exports = BitcoinAverage
