import _ from 'lodash';
import Fuse from 'fuse.js/dist/fuse.basic.common.js';
import request from 'lib/request';
import details from 'lib/wallet/details';
import LS from 'lib/wallet/localStorage';

let cache;
let all;
let tokens;
let index;

const TOKEN_PLATFORMS = ['ethereum', 'binance-smart-chain', 'avalanche-c-chain', 'polygon', 'tron', 'solana'];

export function init() {
  if (!cache) {
    cache = request({
      url: `${process.env.SITE_URL}api/v3/cryptos`,
      method: 'get',
      seed: 'public',
    })
      .then(data => {
        all = data;
        tokens = all.filter((item) => item.type === 'token' && TOKEN_PLATFORMS.includes(item.platform));
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
    'avalanche-c-chain': `${process.env.API_AVAX_URL}api/v1/token/${address}`,
    polygon: `${process.env.API_POLYGON_URL}api/v1/token/${address}`,
    tron: `${process.env.API_TRX_URL}api/v1/token/${address}`,
    solana: `${process.env.API_SOL_URL}api/v1/token/${address}`,
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
      decimals: parseInt(data.decimals, 10),
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
  const filepath = `/assets/crypto/${logo}?ver=${process.env.VERSION}`;
  if (process.env.BUILD_TYPE === 'web') {
    return filepath;
  } else {
    switch (logo) {
      case 'bitcoin.svg':
        return require('@coinspace/crypto-db/logo/bitcoin.svg');
      case 'litecoin.svg':
        return require('@coinspace/crypto-db/logo/litecoin.svg');
      case 'dash.svg':
        return require('@coinspace/crypto-db/logo/dash.svg');
      case 'bitcoin-cash.svg':
        return require('@coinspace/crypto-db/logo/bitcoin-cash.svg');
      case 'bitcoin-sv.svg':
        return require('@coinspace/crypto-db/logo/bitcoin-sv.svg');
      case 'ethereum.svg':
        return require('@coinspace/crypto-db/logo/ethereum.svg');
      case 'dogecoin.svg':
        return require('@coinspace/crypto-db/logo/dogecoin.svg');
      case 'binance-smart-chain.svg':
        return require('@coinspace/crypto-db/logo/binance-smart-chain.svg');
      case 'avalanche-c-chain.svg':
        return require('@coinspace/crypto-db/logo/avalanche.svg');
      case 'polygon.svg':
        return require('@coinspace/crypto-db/logo/polygon.svg');
      case 'tron.svg':
        return require('@coinspace/crypto-db/logo/tron.svg');
      case 'xrp.svg':
        return require('@coinspace/crypto-db/logo/xrp.svg');
      case 'stellar.svg':
        return require('@coinspace/crypto-db/logo/stellar.svg');
      case 'eos.svg':
        return require('@coinspace/crypto-db/logo/eos.svg');
      case 'monero.svg':
        return require('@coinspace/crypto-db/logo/monero.svg');
      case 'tether.svg':
        return require('@coinspace/crypto-db/logo/tether.svg');
      case 'cardano.svg':
        return require('@coinspace/crypto-db/logo/cardano.svg');
      default:
        return new URL(filepath, process.env.SITE_URL);
    }
  }
}

export default {
  init,
  async getCryptos() {
    await init();
    return all;
  },
  getTokenById,
  getTokenByAddress,
  requestTokenByAddress,
  searchTokens,
  getLogoUrl,
  TOKEN_PLATFORMS,
};
