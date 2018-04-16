'use strict';

var geo = require('./geo');
var fee = require('./fee');
var ticker = require('./ticker');
var ethereumTokens = require('./ethereumTokens');

function cleanGeo(interval) {
  setInterval(function intervalFunction(){
    geo.removeOlderThan(interval).catch(console.error);
    return intervalFunction;
  }(), interval)
}

function cacheFees(interval) {
  setInterval(function intervalFunction() {
    fee.getFromAPI('bitcoin').then(function(data) {
      if (global.gc) global.gc();
      return fee.save('bitcoin', {
        minimum: data.minimum,
        hour: data.hourFee,
        fastest: data.fastestFee
      });
    }).catch(console.error);
    return intervalFunction;
  }(), interval);
}

function cacheTicker(interval) {
  setInterval(function intervalFunction() {
    ticker.getFromAPI().then(function(data) {
      if (global.gc) global.gc();
      return ticker.save(data)
    }).catch(console.error);
    return intervalFunction;
  }(), interval);
}

function cacheEthereumTokens(interval) {
  setInterval(function intervalFunction() {
    ethereumTokens.getFromAPI().then(function(data) {
      if (global.gc) global.gc();
      return ethereumTokens.save(data)
    }).catch(console.error);
    return intervalFunction;
  }(), interval);
}

module.exports = {
  cleanGeo: cleanGeo,
  cacheFees: cacheFees,
  cacheTicker: cacheTicker,
  cacheEthereumTokens: cacheEthereumTokens
}
