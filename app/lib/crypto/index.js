import _ from 'lodash';
import Fuse from 'fuse.js/dist/fuse.basic.common.js';
import request from 'lib/request';
import details from 'lib/wallet/details';
import LS from 'lib/wallet/localStorage';

let cache;
let all;
let tokens;
let index;

export function init() {
  if (!cache) {
    cache = request({
      url: `${process.env.SITE_URL}api/v3/cryptos`,
      method: 'get',
      seed: 'public',
    })
      .then(data => {
        all = data;
        tokens = all.filter((item) => item.type === 'token'
          && ['ethereum', 'binance-smart-chain'].includes(item.platform)
        );
      })
      .then(cleanLegacy)
      .then(() => {
        const walletTokens = (details.get('tokens') || []).map((walletToken) => {
          if (walletToken._id) {
            const current = getTokenById(walletToken._id);
            if (current) return current;
          }
          const platform = walletToken.platform || walletToken.network;
          const current = getTokenByAddress(walletToken.address, platform);
          if (current) {
            LS.renameTokenId(walletToken._id, current._id);
            return current;
          }
          const _id = `${walletToken.address}@${platform}`;
          if (walletToken._id !== _id) {
            LS.renameTokenId(walletToken._id, _id);
          }
          return {
            _id,
            platform,
            type: 'token',
            name: walletToken.name,
            symbol: walletToken.symbol,
            address: walletToken.address,
            decimals: walletToken.decimals,
          };
        });
        if (!_.isEqual((details.get('tokens')), walletTokens)) {
          return details.set('tokens', walletTokens);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }
  return cache;
}

function getTokenById(id) {
  return tokens.find(item => item._id === id);
}

function getTokenByAddress(address, platform) {
  return tokens.find(item => item.address === address && item.platform === platform);
}

function requestTokenByAddress(address, platform) {
  const urls = {
    ethereum: `${process.env.API_ETH_URL}api/v1/token/${address}`,
    'binance-smart-chain': `${process.env.API_BSC_URL}api/v1/token/${address}`,
  };

  return request({
    url: urls[platform],
    method: 'get',
  }).then((data) => {
    return {
      _id: `${address}@${platform}`,
      platform,
      type: 'token',
      name: data.name,
      symbol: data.symbol,
      address,
      decimals: data.decimals,
    };
  });
}

function searchTokens(query) {
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

function cleanLegacy() {
  const oldTokens = details.get('walletTokens');
  if (oldTokens) return details.set('walletTokens').catch(() => {});
}

function getLogoUrl(logo) {
  const filepath = `/assets/crypto/${logo}?v=${process.env.VERSION}`;
  if (process.env.BUILD_TYPE === 'web') {
    return filepath;
  } else {
    return new URL(filepath, process.env.SITE_URL);
  }
}

export default {
  init,
  getTokenById,
  getTokenByAddress,
  requestTokenByAddress,
  searchTokens,
  getLogoUrl,
};
