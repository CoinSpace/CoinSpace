'use strict';

var axios = require('axios')
var db = require('./db')

var ticker = require('./ticker')
var Big = require('big.js');

var networks = [
  'bitcoin',
  'bitcoincash',
  'litecoin',
  'dogecoin',
  'dash'
];

var symbols = {
  bitcoin: 'BTC',
  bitcoincash: 'BCH',
  litecoin: 'LTC',
  dogecoin: 'DOGE',
  dash: 'DASH'
}

function get(network) {
  if (networks.indexOf(network) === -1) {
    return Promise.reject({error: 'Currency cs fee is not supported'});
  }

  var collection = db().collection('cs_fee');

  return Promise.all([
    ticker.getFromCache(symbols[network]),
    collection.find({_id: network}).limit(1).next()
  ]).then(function(results) {
    var rate = results[0]['USD'];
    var minFee = 0;
    var maxFee = 0;
    if (rate > 0) {
      minFee = parseInt(Big(1).div(rate).times(results[1].min_usd).times(1e8), 10);
      maxFee = parseInt(Big(1).div(rate).times(results[1].max_usd).times(1e8), 10)
    }
    return {
      minFee: minFee,
      maxFee: maxFee,
      fee: results[1].fee,
      addresses: results[1].addresses,
      whitelist: results[1].whitelist
    }
  });
}

module.exports = {
  get: get
}
