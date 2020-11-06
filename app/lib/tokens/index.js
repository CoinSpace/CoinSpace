'use strict';

const LS = require('lib/wallet/localStorage');
const emitter = require('lib/emitter');
const request = require('lib/request');
const details = require('lib/wallet/details');
const { urlRoot } = window;

let cache;

function filter(token) {
  return {
    _id: token._id,
    name: token.name,
    symbol: token.symbol,
    address: token.address,
    decimals: token.decimals,
    icon: token.icon,
    network: token.network,
  };
}

function getTokens() {
  if (!cache) {
    cache = request({
      url: `${urlRoot}api/v2/tokens?id=${LS.getId()}&network=ethereum`,
      method: 'get',
      seed: 'public',
    });
  }
  return cache;
}

async function getTokenById(id) {
  const tokens = await getTokens();
  const token = tokens.find(item => item._id === id);
  if (token) {
    return filter(token);
  }
}

async function getTokenByAddress(address) {
  const tokens = await getTokens();
  const token = tokens.find(item => item.address === address);
  if (token) {
    return filter(token);
  }
}

async function migrate() {
  const newTokens = details.get('tokens');
  const oldTokens = details.get('walletTokens');

  if (!newTokens && oldTokens) {
    // to be migrated
    let tokens = [];

    const tetherToken = getTokenById('tether');
    if (tetherToken) {
      tokens.push(tetherToken);
    }

    const migratedTokens = oldTokens.map((oldToken) => {
      const token = getTokenByAddress(oldToken.address);
      if (token) {
        return token;
      } else {
        return {
          name: oldToken.name,
          symbol: oldToken.symbol,
          address: oldToken.address,
          decimals: oldToken.decimals,
          network: oldToken.network,
        };
      }
    });

    tokens = [...tokens, ...migratedTokens];

    details.set('tokens', tokens);
    // unset walletTokens
    details.set('walletTokens');
  }
}

emitter.once('wallet-ready', () => {
  migrate().catch((err) => {
    console.error(err);
    LS.reset();
    return location.reload();
  });
});

module.exports = {
  getTokens,
  getTokenById,
  getTokenByAddress,
};
