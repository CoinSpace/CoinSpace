'use strict';

var request = require('lib/request');
var urlRoot = 'https://shapeshift.io';
var prioritySymbols = ['BTC', 'LTC', 'ETH'];

function getCoins() {
  return request({
    url: urlRoot + '/getcoins'
  }).then(function(coins) {
    return getCoinsArray(coins);
  });
}

function getRate(fromSymbol, toSymbol) {
  var pair = (fromSymbol + '_' + toSymbol).toLowerCase();
  return request({
    url: urlRoot + '/rate/' + pair,
  }).then(function(data) {
    return data.rate
  });
}

function validateAddress(address, symbol) {
  return request({
    url: urlRoot + '/validateAddress/' + address + '/' + symbol,
  }).then(function(data) {
    return data.isValid;
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
  getRate: getRate,
  validateAddress: validateAddress
};
