'use strict';

var request = require('lib/request');
var urlRoot = process.env.SITE_URL;

function getExchangeRates(crypto) {
  var url = urlRoot + 'ticker?crypto=' + crypto;
  return request({url: url});
}

module.exports = {
  getExchangeRates: getExchangeRates
}
