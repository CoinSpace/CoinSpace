'use strict';

const db = require('./v1/db');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const rateLimit = require('axios-rate-limit');

const COLLECTION = 'ethereum_tokens';
const CURRENCIES = [
  'AUD', 'BRL', 'CAD', 'CHF', 'CNY',
  'DKK', 'EUR', 'GBP', 'IDR', 'ILS',
  'JPY', 'MXN', 'NOK', 'NZD', 'PLN',
  'RUB', 'SEK', 'SGD', 'TRY', 'UAH',
  'USD', 'ZAR',
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
        //console.log(`Filter token ${item.id} '${item.symbol}' ${item.name}`);
        continue;
      }

      const { data: token } = await coingecko.get(`/coins/${item.id}`);

      if (token.asset_platform_id === 'ethereum' && token.contract_address && token.market_cap_rank) {
        const { data: info } = await coinspace.get(`/token/${token.contract_address}`);
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
            address: token.contract_address,
            decimals: parseInt(info.decimals),
            symbol: info.symbol,
            icon: token.image && token.image.large,
            market_cap_rank: token.market_cap_rank || 9999999,
            synchronized_at: new Date(),
          },
        }, {
          upsert: true,
        });
      } else {
        // For check purposes
        //console.log(`Incorrect token id: '${token.id}' symbol: '${token.symbol}' name: '${token.name}'`);
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
        projection: { _id: 1 },
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
        ids: tokens.map(item => item._id).join(','),
        vs_currencies: CURRENCIES.join(','),
      },
    });

    const operations = [];

    for (const id in data) {
      const updatedAt = new Date();
      const prices = {};
      for (const currency in data[id]) {
        prices[currency.toUpperCase()] = data[id][currency];
      }
      operations.push({
        updateOne: {
          filter: { _id: id },
          update: {
            $set: {
              prices,
              updated_at: updatedAt,
            },
          },
        },
      });
    }

    await db().collection(COLLECTION)
      .bulkWrite(operations, { ordered: false });

    page++;
  } while (tokens.length === PER_PAGE);

  console.timeEnd('update prices');
}

function getTokens() {
  return db().collection(COLLECTION)
    .find({
      synchronized_at: { $gte: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) },
    }, {
      projection: {
        prices: 0,
        synchronized_at: 0,
        updated_at: 0,
      },
    })
    .toArray();
}

// For backward compatibility
async function getPriceBySymbol(symbol) {
  const token = await db().collection(COLLECTION)
    .findOne({ symbol }, { market_cap_rank: { rating: -1 } });
  if (token) {
    return token.prices;
  }
}

// For future use
async function getPrices(ids) {
  const tokens = await db().collection(COLLECTION)
    .find({ _id: { $in: ids } })
    .toArray();

  const data = {};
  for (const token of tokens) {
    data[token._id] = token.prices;
  }
  return data;
}

module.exports = {
  syncTokens,
  getTokens,
  updatePrices,
  getPriceBySymbol,
  getPrices,
};
