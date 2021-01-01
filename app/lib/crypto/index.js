'use strict';

const _ = require('lodash');
const details = require('lib/wallet/details');

const walletCoins = [{
  _id: 'bitcoin',
  network: 'bitcoin',
  name: 'Bitcoin',
}, {
  _id: 'bitcoincash',
  network: 'bitcoincash',
  name: 'Bitcoin Cash',
}, {
  _id: 'bitcoinsv',
  network: 'bitcoinsv',
  name: 'Bitcoin SV',
}, {
  _id: 'ethereum',
  network: 'ethereum',
  name: 'Ethereum',
}, {
  _id: 'litecoin',
  network: 'litecoin',
  name: 'Litecoin',
}, {
  _id: 'ripple',
  network: 'ripple',
  name: 'Ripple',
}, {
  _id: 'stellar',
  network: 'stellar',
  name: 'Stellar',
}, {
  _id: 'eos',
  network: 'eos',
  name: 'EOS',
}, {
  _id: 'dogecoin',
  network: 'dogecoin',
  name: 'Dogecoin',
}, {
  _id: 'dash',
  network: 'dash',
  name: 'Dash',
}];
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
    const coin = walletCoins.find((item) => {
      return item._id === crypto;
    });
    if (coin) {
      return coin;
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
  walletCoins,
  getCrypto,
  setCrypto,
};
