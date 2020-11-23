'use strict';

const db = require('./db');

const tokens = require('../tokens');
const Big = require('big.js');

const networks = [
  'bitcoin',
  'bitcoincash',
  'bitcoinsv',
  'litecoin',
  'dogecoin',
  'dash',
];

function get(network) {
  if (networks.indexOf(network) === -1) {
    return Promise.reject({ error: 'Currency cs fee is not supported' });
  }

  const collection = db().collection('cs_fee');

  return Promise.all([
    tokens.getTicker(network),
    collection.find({ _id: network }).limit(1).next(),
  ]).then((results) => {
    const rate = results[0]['prices']['USD'];
    let minFee = 0;
    let maxFee = 0;
    let rbfFee = 0;
    if (rate > 0) {
      minFee = parseInt(Big(1).div(rate).times(results[1].min_usd).times(1e8), 10);
      maxFee = parseInt(Big(1).div(rate).times(results[1].max_usd).times(1e8), 10);
      rbfFee = parseInt(Big(1).div(rate).times(results[1].rbf_usd || 0).times(1e8), 10);
    }
    return {
      minFee,
      maxFee,
      fee: results[1].fee,
      rbfFee,
      addresses: results[1].addresses,
      whitelist: results[1].whitelist,
    };
  });
}

module.exports = {
  get,
};
