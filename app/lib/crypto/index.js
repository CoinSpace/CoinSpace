'use strict';

const _ = require('lodash');
const details = require('lib/wallet/details');

const walletCoins = [
  'bitcoin',
  'bitcoincash',
  'bitcoinsv',
  'litecoin',
  'dogecoin',
  'dash',
  'ethereum',
  'ripple',
  'stellar',
  'eos',
];
const DEFAULT_COIN = 'bitcoin';

function getCrypto() {
  let crypto = window.localStorage.getItem('_cs_token') || DEFAULT_COIN;
  const walletTokens = details.get('tokens');

  try {
    crypto = JSON.parse(crypto);
  // eslint-disable-next-line no-empty
  } catch (e) {}

  if (typeof crypto === 'object') {
    const token = _.find(walletTokens, (item) => {
      return _.isEqual(crypto, item);
    });
    if (token) {
      return token;
    }
  } else {
    if (walletCoins.includes(crypto)) {
      return {
        _id: crypto,
        network: crypto,
      };
    }
    const token = walletTokens.find((item) => {
      return item._id === crypto;
    });
    if (token) {
      return token;
    }
  }
  setCrypto(DEFAULT_COIN);
  return {
    _id: DEFAULT_COIN,
    network: DEFAULT_COIN,
  };
}

function setCrypto(crypto) {
  if (!crypto) {
    window.localStorage.setItem('_cs_token', DEFAULT_COIN);
  } else if (typeof crypto === 'string') {
    window.localStorage.setItem('_cs_token', crypto);
  } else if (crypto._id) {
    window.localStorage.setItem('_cs_token', crypto._id);
  } else {
    window.localStorage.setItem('_cs_token', JSON.stringify(crypto));
  }
}

module.exports = {
  getCrypto,
  setCrypto,
};
