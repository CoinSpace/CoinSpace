'use strict';

var request = require('lib/request');
var urlRoot = 'https://shapeshift.io';
var prioritySymbols = ['BTC', 'BCH', 'ETH', 'LTC', 'XRP', 'XLM'];

function getCoins() {
  return request({
    url: urlRoot + '/getcoins'
  }).then(function(coins) {
    return getCoinsArray(coins);
  });
}

function validateAddress(address, symbol) {
  if (!address) return Promise.resolve(false);
  if (!symbol) return Promise.resolve(false);
  return request({
    url: urlRoot + '/validateAddress/' + address + '/' + symbol,
  }).then(function(data) {
    return !!data.isvalid;
  });
}

function shift(options) {
  var data = {
    withdrawal: options.toAddress,
    pair: (options.fromSymbol + '_' + options.toSymbol).toLowerCase(),
    apiKey: process.env.SHAPESHIFT_API_KEY
  };
  if (options.returnAddress) {
    data.returnAddress = options.returnAddress;
  }
  return request({
    url: urlRoot + '/shift',
    method: 'post',
    data: data
  }).then(function(data) {
    if (data.error) throw new Error(data.error);
    return {
      depositAddress: data.deposit,
      depositSymbol: data.depositType,
      toAddress: data.withdrawal,
      toSymbol: data.withdrawalType
    };
  });
}

function txStat(depositAddress) {
  return request({
    url: urlRoot + '/txStat/' + encodeURIComponent(depositAddress)
  }).then(function(data) {
    if (data.error && data.status !== 'failed') throw new Error(data.error);
    return data;
  });
}

function marketInfo(fromSymbol, toSymbol) {
  var pair = (fromSymbol + '_' + toSymbol).toLowerCase();
  return request({
    url: urlRoot + '/marketinfo/' + pair
  }).then(function(data) {
    if (data.error) throw new Error(data.error);
    return data;
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
  validateAddress: validateAddress,
  shift: shift,
  txStat: txStat,
  marketInfo: marketInfo
};
