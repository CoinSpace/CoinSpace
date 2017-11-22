'use strict';

var request = require('lib/request')

var tickers = {
  bitcoin: 'BTC',
  bitcoincash: 'BCH',
  testnet: 'BTC',
  litecoin: 'LTC',
  ethereum: 'ETH'
}

var network = null
var urlRoot = process.env.SITE_URL

function BitcoinAverage(n){
  network = n
  if (!tickers[network]) {
    throw new Error(network + ' price ticker is not supported');
  }
}

BitcoinAverage.prototype.getExchangeRates = function(callback){
  var ticker = tickers[network]
  var url = urlRoot + '/ticker?crypto=' + ticker
  request({url: url}, callback);
}

module.exports = BitcoinAverage
