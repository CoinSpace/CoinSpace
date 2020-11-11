'use strict';

const db = require('./v1/db');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const rateLimit = require('axios-rate-limit');

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
  'bitcoin',
  // BCH
  'bitcoin-cash',
  // BSV
  'bitcoin-cash-sv',
  // LTC
  'litecoin',
  // ETH
  'ethereum',
  // XRP
  'ripple',
  // XLM
  'stellar',
  // EOS
  'eos',
  // DOGE
  'dogecoin',
  // DASH
  'dash',
];

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
});

rateLimit(coingecko, {
  maxRequests: 100,
  // per minute
  perMilliseconds: 60 * 1000,
});

const coinspace = axios.create({
  baseURL: 'https://eth.coin.space/api/v1',
  timeout: 30000,
});

axiosRetry(coinspace, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  shouldResetTimeout: true,
});

rateLimit(coinspace, {
  maxRequests: 300,
  // per minute
  perMilliseconds: 60 * 1000,
});

async function syncTokens() {
  console.time('sync tokens');

  const { data: list } = await coingecko.get('/coins/list');

  for (const item of list) {
    try {
      if (['0-5x-long-', '1x-short-', '3x-long-', '3x-short-'].some(pattern => item.id.startsWith(pattern))) {
        //console.log(`Filter token id: '${item.id}' symbol: '${item.symbol}' name: '${item.name}'`);
        continue;
      }

      const { data: token } = await coingecko.get(`/coins/${item.id}`);

      if (token.asset_platform_id === null && CRYPTOCURRENCIES.includes(token.id)) {
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
            network: null,
            symbol: token.symbol.toUpperCase(),
            icon: token.image && token.image.large,
            market_cap_rank: token.market_cap_rank || Number.MAX_SAFE_INTEGER,
            synchronized_at: new Date(),
            coingecko_id: token.id,
          },
        }, {
          upsert: true,
        });
      } else if (token.asset_platform_id === 'ethereum'
                && token.contract_address
                && token.market_cap_rank) {
        const address = token.contract_address.toLowerCase();
        const { data: info } = await coinspace.get(`/token/${address}`);
        /*
        // For check purposes
        if (info.name.trim() !== token.name.trim()) {
          console.log(`Different name: '${info.name}' !== '${token.name}'`);
        }
        if (info.symbol.toUpperCase() !== token.symbol.toUpperCase()) {
          console.log(`Different symbol: '${info.symbol}' !== '${token.symbol}'`);
        }
        */
        await db().collection(COLLECTION).updateOne({
          _id: token.id,
        }, {
          $set: {
            name: token.name,
            network: 'ethereum',
            address,
            decimals: parseInt(info.decimals),
            symbol: info.symbol,
            icon: token.image && token.image.large,
            market_cap_rank: token.market_cap_rank || Number.MAX_SAFE_INTEGER,
            synchronized_at: new Date(),
            coingecko_id: token.id,
          },
        }, {
          upsert: true,
        });
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

function getTokens(network, limit=0) {
  const query = {
    synchronized_at: { $gte: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) },
  };
  if (network) {
    query.network = network;
  }
  return db().collection(COLLECTION)
    .find(query, {
      limit,
      sort: {
        market_cap_rank: 1,
      },
      projection: {
        coingecko_id: 0,
        prices: 0,
        synchronized_at: 0,
        updated_at: 0,
      },
    })
    .toArray();
}

function getPrice(id) {
  return db().collection(COLLECTION)
    .findOne({
      _id: id,
    }, {
      projection: {
        address: 0,
        decimals: 0,
        icon: 0,
        market_cap_rank: 0,
        coingecko_id: 0,
        synchronized_at: 0,
        updated_at: 0,
      },
    })
    .then((doc) => doc.prices);
}

function getPrices(ids) {
  return db().collection(COLLECTION)
    .find({
      _id: { $in: ids },
    }, {
      projection: {
        address: 0,
        decimals: 0,
        icon: 0,
        market_cap_rank: 0,
        coingecko_id: 0,
        synchronized_at: 0,
        updated_at: 0,
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
async function getPriceBySymbol(symbol) {
  const token = await db().collection(COLLECTION)
    .findOne({ symbol }, { sort: { market_cap_rank: 1 } });
  if (token) {
    fixSatoshi(token);
    return token.prices;
  }
}

// For backward compatibility
async function getFromCacheForAppleWatch() {
  const tickers = {
    'bitcoin': 'BTC',
    'bitcoincash': 'BCH',
    'litecoin': 'LTC',
    'ethereum': 'ETH',
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
  getPrice,
  getPrices,
  // For backward compatibility
  getPriceBySymbol,
  getFromCacheForAppleWatch,
};
