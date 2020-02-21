'use strict';

var getTokenNetwork = require('lib/token').getTokenNetwork;

var btcBchLtc = require('./btcBchLtc');
var ethereum = require('./ethereum');
var ripple = require('./ripple');
var stellar = require('./stellar');
var eos = require('./eos');

function open(data) {
  var network = getTokenNetwork();
  if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash'].indexOf(network) !== -1) {
    return btcBchLtc(data);
  } else if (network === 'ethereum') {
    return ethereum(data);
  } else if (network === 'ripple') {
    return ripple(data);
  } else if (network === 'stellar') {
    return stellar(data);
  } else if (network === 'eos') {
    return eos(data);
  }
}

module.exports = open
