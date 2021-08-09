import _ from 'lodash';
import Fuse from 'fuse.js/dist/fuse.basic.common.js';
import LS from 'lib/wallet/localStorage';
import emitter from 'lib/emitter';
import request from 'lib/request';
import details from 'lib/wallet/details';

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
      url: `${process.env.SITE_URL}api/v2/tokens`,
      params: {
        network: ['ethereum', 'binance-smart-chain'].join(','),
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
            const current = getTokenById(walletToken._id, walletToken.network);
            return current || walletToken;
          } else {
            const current = getTokenByAddress(walletToken.address, walletToken.network);
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

function getTokenById(id, network = 'ethereum') {
  const token = tokens.find(item => item._id === id && item.network === network);
  if (token) {
    return filter(token);
  }
}

function getTokenByAddress(address, network = 'ethereum') {
  const token = tokens.find(item => item.address === address && item.network === network);
  if (token) {
    return filter(token);
  }
}

function requestTokenByAddress(address, network = 'ethereum') {
  const urls = {
    ethereum: `${process.env.API_ETH_URL}token/${address}`,
    'binance-smart-chain': `${process.env.API_BSC_URL}api/v1/token/${address}`,
  };

  return request({
    url: urls[network],
    method: 'get',
  }).then((data) => {
    return {
      address,
      symbol: data.symbol,
      name: data.name,
      decimals: data.decimals,
      network,
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

    const tetherToken = getTokenById('tether', 'ethereum');
    if (tetherToken) {
      walletTokens.push(tetherToken);
    }

    const migratedTokens = oldTokens.map((oldToken) => {
      const token = getTokenByAddress(oldToken.address, 'ethereum');
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

export default {
  init,
  getTokens,
  getTokenById,
  getTokenByAddress,
  requestTokenByAddress,
  search,
};
