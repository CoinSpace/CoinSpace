'use strict';

var getTokenNetwork = require('lib/token').getTokenNetwork;

var btcBchLtc = require('./btcBchLtc');
var ethereum = require('./ethereum');
var ripple = require('./ripple');
var stellar = require('./stellar');

function open(data) {
  var network = getTokenNetwork();
  if (['bitcoin', 'bitcoincash', 'litecoin', 'testnet'].indexOf(network) !== -1) {
    return btcBchLtc(data);
  } else if (network === 'ethereum') {
    return ethereum(data);
  } else if (network === 'ripple') {
    return ripple(data);
  } else if (network === 'stellar') {
    return stellar(data);
  }
}

module.exports = open
