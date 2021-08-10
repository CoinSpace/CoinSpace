'use strict';

const db = require('./v1/db');
const createError = require('http-errors');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const rateLimit = require('axios-rate-limit');
const querystring = require('querystring');

const COLLECTION = 'tokens';
const CURRENCIES = [
  'AUD', 'BRL', 'CAD', 'CHF', 'CNY',
  'DKK', 'EUR', 'GBP', 'IDR', 'ILS',
  'JPY', 'MXN', 'NOK', 'NZD', 'PLN',
  'RUB', 'SEK', 'SGD', 'TRY', 'UAH',
  'USD', 'ZAR',
];
const CRYPTOCURRENCIES = [
  // BTC
  {
    id: 'bitcoin',
    decimals: 8,
  },
  // BCH
  {
    id: 'bitcoin-cash',
    decimals: 8,
  },
  // BSV
  {
    id: 'bitcoin-cash-sv',
    decimals: 8,
  },
  // LTC
  {
    id: 'litecoin',
    decimals: 8,
  },
  // ETH
  {
    id: 'ethereum',
    decimals: 18,
  },
  // XRP
  {
    id: 'ripple',
    decimals: 6,
  },
  // XLM
  {
    id: 'stellar',
    decimals: 7,
  },
  // EOS
  {
    id: 'eos',
    decimals: 4,
  },
  // DOGE
  {
    id: 'dogecoin',
    decimals: 8,
  },
  // DASH
  {
    id: 'dash',
    decimals: 8,
  },
  // XMR
  {
    id: 'monero',
    decimals: 12,
  },
  // BNB
  {
    id: 'binancecoin',
    decimals: 18,
  },
];
const PRIORITY_IDS = [...CRYPTOCURRENCIES.map((crypto) => crypto.id), 'tether'];
const TOKEN_PLATFORMS = ['ethereum', 'binance-smart-chain'];

const coingecko = axios.create({
  baseURL: 'https://api.coingecko.com/api/v3',
  timeout: 30000,
});

axiosRetry(coingecko, {
  retries: 3,
  retryDelay: () => 30 * 1000,
  retryCondition: (err) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(err) || (err.response && err.response.status === 429);
  },
  shouldResetTimeout: true,
});

rateLimit(coingecko, {
  maxRequests: 100,
  // per minute
  perMilliseconds: 60 * 1000,
});

const coinspace = TOKEN_PLATFORMS.reduce((result, platform) => {
  let baseURL;
  if (platform === 'ethereum') {
    baseURL = 'https://eth.coin.space/api/v1';
  } else if (platform === 'binance-smart-chain') {
    baseURL = 'https://bsc.coin.space/api/v1';
  } else {
    throw new Error('Unsupported network');
  }
  const client = axios.create({
    baseURL,
    timeout: 30000,
  });
  axiosRetry(client, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    shouldResetTimeout: true,
  });
  rateLimit(client, {
    maxRequests: 300,
    // per minute
    perMilliseconds: 60 * 1000,
  });
  result[platform] = client;
  return result;
}, {});

async function syncTokens() {
  console.log('sync tokens: start');
  console.time('sync tokens');

  const { data: list } = await coingecko.get('/coins/list');
  list.sort((a, b) => {
    const cryptoA = PRIORITY_IDS.includes(a.id);
    const cryptoB = PRIORITY_IDS.includes(b.id);
    if (cryptoA && cryptoB) return 0;
    if (cryptoA) return -1;
    if (cryptoB) return 1;
    return 0;
  });

  for (const item of list) {
    try {
      if (['0-5x-long-', '1x-short-', '3x-long-', '3x-short-'].some(pattern => item.id.startsWith(pattern))) {
        //console.log(`Filter token id: '${item.id}' symbol: '${item.symbol}' name: '${item.name}'`);
        continue;
      }

      const query = querystring.stringify({
        localization: false,
        tickers: false,
        market_data: false,
        community_data: false,
        developer_data: false,
        sparkline: false,
      });
      const { data: token } = await coingecko.get(`/coins/${item.id}?${query}`);

      const crypto = CRYPTOCURRENCIES.find((crypto) => crypto.id === item.id);

      if (crypto) {
        let _id = token.id;
        // migrate id
        if (_id === 'bitcoin-cash') {
          _id = 'bitcoincash';
        }
        if (_id === 'bitcoin-cash-sv') {
          _id = 'bitcoinsv';
        }
        await db().collection(COLLECTION).updateOne({
          _id,
        }, {
          $set: {
            name: token.name,
            decimals: crypto.decimals,
            symbol: token.symbol.toUpperCase(),
            icon: token.image && token.image.large,
            market_cap_rank: token.market_cap_rank || Number.MAX_SAFE_INTEGER,
            synchronized_at: new Date(),
            coingecko_id: token.id,
          },
        }, {
          upsert: true,
        });
        console.log(`updated coin: ${_id}`);
      }
      if (token.platforms
                && (TOKEN_PLATFORMS.some(platform => Object.keys(token.platforms).includes(platform)))
                && token.market_cap_rank) {

        const platforms = {};
        for (const platform of Object.keys(token.platforms)) {
          if (!TOKEN_PLATFORMS.includes(platform)) continue;
          const address = token.platforms[platform].toLowerCase();
          const { data: info } = await coinspace[platform].get(`/token/${address}`)
            .catch((err) => {
              if (err.response && err.response.status === 400) {
                // For check purposes
                //throw new Error(`Incorrect address: ${address}`);
                return {};
              }
              if (err.response && err.response.status === 404) {
                // For check purposes
                //throw new Error(`Token not found on address: ${address}`);
                return {};
              }
              throw err;
            });
          if (!info) {
            continue;
          }
          /*
          // For check purposes
          if (info.name.trim() !== token.name.trim()) {
            console.log(`Different name: '${info.name}' !== '${token.name}'`);
          }
          if (info.symbol.toUpperCase() !== token.symbol.toUpperCase()) {
            console.log(`Different symbol: '${info.symbol}' !== '${token.symbol}'`);
          }
          */
          platforms[platform] = {
            address,
            decimals: parseInt(info.decimals),
            symbol: info.symbol,
          };
        }
        await db().collection(COLLECTION).updateOne({
          _id: token.id,
        }, {
          $set: {
            platforms,
            name: token.name,
            icon: token.image && token.image.large,
            market_cap_rank: token.market_cap_rank || Number.MAX_SAFE_INTEGER,
            synchronized_at: new Date(),
            coingecko_id: token.id,
          },
        }, {
          upsert: true,
        });
        console.log(`updated token: ${token.id}`);
      } else {
        // For check purposes
        // eslint-disable-next-line max-len
        //console.log(`Skip token id: '${token.id}' network: ${token.asset_platform_id} symbol: '${token.symbol}' name: '${token.name}'`);
      }
    } catch (err) {
      console.error(err);
    }
  }
  console.timeEnd('sync tokens');
}

async function updatePrices() {
  console.time('update prices');

  const PER_PAGE = 500;
  let page = 0;
  let tokens;
  do {
    tokens = await db().collection(COLLECTION)
      .find({
        // 7 days ago
        synchronized_at: { $gte: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) },
      }, {
        projection: { _id: 1, coingecko_id: 1 },
      })
      .sort({ _id: 1 })
      .limit(PER_PAGE)
      .skip(PER_PAGE * page)
      .toArray();

    if (tokens.length === 0) {
      break;
    }

    const { data } = await coingecko.get('/simple/price', {
      params: {
        ids: tokens.map(item => item.coingecko_id).join(','),
        vs_currencies: CURRENCIES.join(','),
      },
    });

    const operations = [];

    for (const coingeckoId in data) {
      const updatedAt = new Date();
      const prices = {};
      for (const currency in data[coingeckoId]) {
        prices[currency.toUpperCase()] = data[coingeckoId][currency];
      }
      operations.push({
        updateOne: {
          filter: { _id: tokens.find(token => token.coingecko_id === coingeckoId)._id },
          update: {
            $set: {
              prices,
              updated_at: updatedAt,
            },
          },
        },
      });
    }

    if (operations.length > 0) {
      await db().collection(COLLECTION)
        .bulkWrite(operations, { ordered: false });
    }

    page++;
  } while (tokens.length === PER_PAGE);

  console.timeEnd('update prices');
}

async function getTokens(networks, limit=0) {
  const query = {
    synchronized_at: { $gte: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) },
    $or: networks.map((network) => {
      return { [`platforms.${network}`]: { $exists: true } };
    }),
  };
  const tokens = await db().collection(COLLECTION)
    .find(query, {
      limit,
      sort: {
        market_cap_rank: 1,
      },
      projection: {
        name: 1,
        platforms: 1,
        icon: 1,
        market_cap_rank: 1,
      },
    })
    .toArray();

  const result = [];
  tokens.forEach((token) => {
    networks.forEach((platform) => {
      if (!token.platforms[platform]) return;
      result.push({
        _id: token._id,
        name: token.name,
        symbol: token.platforms[platform].symbol,
        address: token.platforms[platform].address,
        decimals: token.platforms[platform].decimals,
        icon: token.icon,
        market_cap_rank: token.market_cap_rank,
        network: platform,
      });
    });
  });
  return result;
}

function getTicker(id) {
  return db().collection(COLLECTION)
    .findOne({
      _id: id,
    }, {
      projection: {
        prices: 1,
        decimals: 1,
      },
    })
    .then((doc) => {
      if (!doc) {
        throw createError(404, 'Coin or token not found');
      }
      return doc;
    });
}

function getTickers(ids) {
  return db().collection(COLLECTION)
    .find({
      _id: { $in: ids },
    }, {
      projection: {
        prices: 1,
      },
    })
    .toArray();
}

// For backward compatibility
function fixSatoshi(doc) {
  if (doc._id === 'bitcoin') {
    doc['prices']['mBTC'] = 1000;
    doc['prices']['μBTC'] = 1000000;
  } else if (doc._id === 'bitcoincash') {
    doc['prices']['mBCH'] = 1000;
    doc['prices']['μBCH'] = 1000000;
  } else if (doc._id === 'bitcoinsv') {
    doc['prices']['mBSV'] = 1000;
    doc['prices']['μBSV'] = 1000000;
  }
}

// For backward compatibility
async function getFromCacheForAppleWatch() {
  const tickers = {
    bitcoin: 'BTC',
    bitcoincash: 'BCH',
    litecoin: 'LTC',
    ethereum: 'ETH',
  };
  return await db().collection(COLLECTION)
    .find({ _id: { $in: Object.keys(tickers) } })
    .toArray()
    .then((docs) => {
      return docs.reduce((result, doc) => {
        fixSatoshi(doc);
        result[tickers[doc._id]] = doc.prices;
        return result;
      }, {});
    });
}

module.exports = {
  syncTokens,
  getTokens,
  updatePrices,
  getTicker,
  getTickers,
  // For backward compatibility
  getFromCacheForAppleWatch,
};
