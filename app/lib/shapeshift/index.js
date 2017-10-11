'use strict';

var xhr = require('lib/xhr');
var uriRoot = 'https://shapeshift.io';
var prioritySymbols = ['BTC', 'LTC', 'ETH'];

function getCoins(callback) {
  xhr({
    uri: uriRoot + '/getcoins',
    method: 'GET'
  }, function(err, resp, body){
    if (resp.statusCode !== 200) {
      console.error(body);
      return callback(JSON.parse(body));
    }
    var coins = JSON.parse(body);
    callback(null, getCoinsArray(coins));
  });
}

function getRate(fromSymbol, toSymbol, callback) {
  var pair = (fromSymbol + '_' + toSymbol).toLowerCase();
  xhr({
    uri: uriRoot + '/rate/' + pair,
    method: 'GET'
  }, function(err, resp, body){
    if (resp.statusCode !== 200) {
      console.error(body);
      return callback(JSON.parse(body));
    }
    var data = JSON.parse(body);
    callback(null, data.rate);
  });
}

function getCoinsArray(coins) {
  prioritySymbols = prioritySymbols.filter(function(symbol) {
    return coins[symbol];
  });

  var symbols = Object.keys(coins);
  symbols = symbols.filter(function(symbol) {
    return prioritySymbols.indexOf(symbol) === -1;
  });

  var allSymbols = prioritySymbols.concat(symbols);

  return allSymbols.map(function(symbol) {
    var coin = coins[symbol];
    return {
      name: coin.name,
      symbol: coin.symbol,
      disabled: coin.status !== 'available',
    };
  });
}

module.exports = {
  getCoins: getCoins,
  getRate: getRate
};
