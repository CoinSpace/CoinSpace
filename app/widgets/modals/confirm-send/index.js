'use strict';

var getTokenNetwork = require('lib/token').getTokenNetwork;

var btcBchLtc = require('./btcBchLtc');
var ethereum = require('./ethereum');
var ripple = require('./ripple');

function open(data) {
  var network = getTokenNetwork();
  if (['bitcoin', 'bitcoincash', 'litecoin', 'testnet'].indexOf(network) !== -1) {
    return btcBchLtc(data);
  } else if (network === 'ethereum') {
    return ethereum(data);
  } else if (network === 'ripple') {
    return ripple(data);
  }
}

module.exports = open
