'use strict';

var xhr = require('xhr')

var tickers = {
  bitcoin: 'BTC',
  testnet: 'BTC',
  litecoin: 'LTC',
  ethereum: 'ETH'
}

var network = null
var uriRoot = process.env.SITE_URL

function BitcoinAverage(n){
  network = n
  if(!tickers[network]) {
    throw new Error(network + " price ticker is not supported")
  }
}

BitcoinAverage.prototype.getExchangeRates = function(callback){
  var ticker = tickers[network]
  var uri = uriRoot + '/ticker?crypto=' + ticker
  xhr({
    uri: uri,
    timeout: 10000,
    method: 'GET'
  }, function(err, resp, body){
    if(resp.statusCode !== 200) {
      console.error(body)
      return callback(err)
    }

    callback(null, JSON.parse(body))
  })
}

module.exports = BitcoinAverage
