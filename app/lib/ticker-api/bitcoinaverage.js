'use strict';

var xhr = require('xhr')
var currencies = require('./currencies')
var ltcToBtc = require('./sochain').ltcToBtc

var ExchangeRateFunctions = {
  bitcoin: getExchangeRates,
  testnet: getExchangeRates,
  litecoin: getLitecoinExchangeRates
}

function BitcoinAverage(network){
  BitcoinAverage.prototype.getExchangeRates = ExchangeRateFunctions[network]
  if(!BitcoinAverage.prototype.getExchangeRates) {
    throw new Error(network + " price ticker is not supported")
  }
}
BitcoinAverage.apiRoot = "https://api.bitcoinaverage.com/ticker/"

function getLitecoinExchangeRates(callback){
  ltcToBtc(function(err, ltcRate){
    if(err) return callback(err);

    getExchangeRates(function(err, rates){
      if(err) return callback(err);

      for(var currency in rates){
        rates[currency] = rates[currency] * ltcRate
      }

      callback(null, rates)
    })
  })
}

function getExchangeRates(callback){
  var uri = BitcoinAverage.apiRoot + "global/all"
  xhr({
    uri: uri,
    timeout: 10000,
    method: 'GET'
  }, function(err, resp, body){
    if(resp.statusCode !== 200) {
      console.error(body)
      return callback(err)
    }

    callback(null, toRates(JSON.parse(body)))
  })
}

function toRates(apiRates){
  var rates = {}
  currencies.forEach(function(currency){
    rates[currency] = apiRates[currency].last
  })

  return rates
}

BitcoinAverage.prototype.getExchangeRates = getExchangeRates
module.exports = BitcoinAverage
