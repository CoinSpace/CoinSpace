'use strict';

const request = require('lib/request');
const emitter = require('lib/emitter');

let rates = {};

function init(crypto) {
  const cryptoIds = crypto.map((item) => {
    if (typeof item === 'string') {
      return item;
    }
    if (item._id) {
      return item._id;
    }
  }).filter((item) => !!item);
  if (!cryptoIds.length) {
    emitter.emit('rates-updated', rates);
    return;
  }
  return request({
    url: `${window.urlRoot}api/v2/tickers`,
    params: {
      crypto: cryptoIds.join(','),
    },
    method: 'get',
    seed: 'public',
  }).catch((err) => {
    console.error(err);
    rates = {};
    emitter.emit('rates-updated', rates);
  }).then((data) => {
    for (const item of data) {
      rates[item._id] = item.prices;
    }
    emitter.emit('rates-updated', rates);
  });
}

function getRates() {
  return rates;
}

module.exports = {
  init,
  getRates,
};
