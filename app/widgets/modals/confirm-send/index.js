'use strict';

const btcBchLtc = require('./btcBchLtc');
const ethereum = require('./ethereum');
const ripple = require('./ripple');
const stellar = require('./stellar');
const eos = require('./eos');

function open(data) {
  const network = data.wallet.networkName;
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

module.exports = open;
