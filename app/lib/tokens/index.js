'use strict';

const _ = require('lodash');
const Fuse = require('fuse.js/dist/fuse.basic.common.js');
const LS = require('lib/wallet/localStorage');
const emitter = require('lib/emitter');
const request = require('lib/request');
const details = require('lib/wallet/details');
const { urlRoot } = window;

let cache;
let tokens;
let index;

// strip unnecessary fields
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

function init() {
  if (!cache) {
    cache = request({
      url: `${urlRoot}api/v2/tokens`,
      params: {
        network: 'ethereum',
      },
      method: 'get',
      seed: 'public',
    });

    cache
      .then(data => {
        tokens = data;
      })
      .then(() => {
        const walletTokens = (details.get('tokens') || []).map((walletToken) => {
          if (walletToken._id) {
            const current = getTokenById(walletToken._id);
            return current || walletToken;
          } else {
            const current = getTokenByAddress(walletToken.address);
            return current || walletToken;
          }
        });
        if (!_.isEqual(details.get('tokens'), walletTokens)) {
          return details.set('tokens', walletTokens);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }
  return cache;
}

function getTokens() {
  if (!tokens) {
    throw new Error('tokens not ready');
  }
  return tokens;
}

function getTokenById(id) {
  const token = tokens.find(item => item._id === id);
  if (token) {
    return filter(token);
  }
}

function getTokenByAddress(address) {
  const token = tokens.find(item => item.address === address);
  if (token) {
    return filter(token);
  }
}

function requestTokenByAddress(address) {
  return request({
    url: `${process.env.API_ETH_URL}token/${address}`,
    method: 'get',
  }).then((data) => {
    return {
      address,
      symbol: data.symbol,
      name: data.name,
      decimals: data.decimals,
      network: 'ethereum',
    };
  });
}

function search(query) {
  if (!query || !query.trim()) {
    return tokens;
  }
  if (!index) {
    index = new Fuse(tokens, {
      keys: ['name', 'symbol', 'address', '_id'],
    });
  }
  return index.search(query.trim()).map(item => item.item);
}

async function migrate() {
  const newTokens = details.get('tokens');
  const oldTokens = details.get('walletTokens');

  if (!newTokens && oldTokens) {
    // to be migrated

    await init();

    let walletTokens = [];

    const tetherToken = getTokenById('tether');
    if (tetherToken) {
      walletTokens.push(tetherToken);
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

    walletTokens = [...walletTokens, ...migratedTokens];

    details.set('tokens', walletTokens);
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
  init,
  getTokens,
  getTokenById,
  getTokenByAddress,
  requestTokenByAddress,
  search,
};
