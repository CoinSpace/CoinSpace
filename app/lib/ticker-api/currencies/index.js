'use strict';

var bitcoin = require('./bitcoin.json');
var litecoin = require('./litecoin.json');
var ethereum = require('./ethereum.json');

var currencies = {
  bitcoin: bitcoin,
  testnet: bitcoin,
  litecoin: litecoin,
  ethereum: ethereum
}

function getCurrencies(network) {
  if (!currencies[network]) {
    throw new Error(network + ' currency ticker is not supported');
  }
  return currencies[network];
}

module.exports = getCurrencies;
