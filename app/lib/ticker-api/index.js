'use strict';

const request = require('lib/request');
const { urlRoot } = window;

function getExchangeRates(crypto) {
  const url = urlRoot + 'v1/ticker?crypto=' + crypto;
  return request({ url });
}

module.exports = {
  getExchangeRates,
};
