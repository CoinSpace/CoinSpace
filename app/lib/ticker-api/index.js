'use strict';

var request = require('lib/request');
var urlRoot = window.urlRoot;

function getExchangeRates(crypto) {
  var url = urlRoot + 'v1/ticker?crypto=' + crypto;
  return request({url: url});
}

module.exports = {
  getExchangeRates: getExchangeRates
}
