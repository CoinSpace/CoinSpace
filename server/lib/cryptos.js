import coingecko from './coingecko.js';
import coinmarketcap from './coinmarketcap.js';
import cryptoDB from '@coinspace/crypto-db';
import db from './db.js';

const COLLECTION = 'cryptos';
const CURRENCIES = [
  'AED', 'ARS', 'AUD', 'BDT', 'BHD',
  'BMD', 'BRL', 'CAD', 'CHF', 'CLP',
  'CNY', 'CZK', 'DKK', 'EUR', 'GBP',
  'HKD', 'HUF', 'IDR', 'ILS', 'INR',
  'JPY', 'KRW', 'KWD', 'LKR', 'MMK',
  'MXN', 'MYR', 'NGN', 'NOK', 'NZD',
  'PHP', 'PKR', 'PLN', 'RUB', 'SAR',
  'SEK', 'SGD', 'THB', 'TRY', 'TWD',
  'UAH', 'USD', 'VEF', 'VND', 'ZAR',
];
const CRYPTO_PROPS = ['coingecko', 'changelly', 'coinmarketcap', 'moonpay'];

function getPlatformName(crypto) {
  return crypto.platformName || crypto.platform
    .split('-')
    .map((item) => {
      return item.charAt(0).toUpperCase() + item.slice(1);
    })
    .join(' ');
}

async function sync() {
  console.log('crypto sync - started');
  for (const crypto of cryptoDB) {
    const update = {
      $set: {
        ...crypto,
        platformName: getPlatformName(crypto),
        supported: crypto.supported !== false,
        deprecated: crypto.deprecated === true,
        synchronized_at: new Date(),
      },
    };
    for (const prop of CRYPTO_PROPS) {
      if (!Object.prototype.hasOwnProperty.call(crypto, prop)) {
        update['$unset'] = update['$unset'] || {};
        update['$unset'][prop] = true;
      }
    }
    await db.collection(COLLECTION).updateOne({
      _id: crypto._id,
    }, update, {
      upsert: true,
    });
    console.log(`synced crypto: ${crypto._id}`);
  }
  console.log('crypto sync - finished');
}

async function updatePrices() {
  console.log('crypto update prices - started');
  const logs = ['SLOW PRICES UPDATE'];
  const timeout = setTimeout(() => {
    console.error(logs.join('\n'));
  }, 10 * 60 * 1000 /* 10 min */);
  const PER_PAGE = 500;
  let page = 0;
  let cryptos;
  try {
    do {
      logs.push(`crypto update prices - load from db (chunk #${page}) - start`);
      cryptos = await db.collection(COLLECTION)
        .aggregate([{
          $match: {
            deprecated: false,
          },
        }, {
          $group: {
            _id: '$coingecko.id',
          },
        }, {
          $sort: {
            _id: 1,
          },
        }, {
          $skip: PER_PAGE * page,
        }, {
          $limit: PER_PAGE,
        }])
        .toArray();
      logs.push(`crypto update prices - load from db (chunk #${page}) - finish`);

      if (cryptos.length === 0) {
        break;
      }

      logs.push(`crypto update prices - load prices from coingecko (chunk #${page}) - start`);
      const { data } = await coingecko.get('/simple/price', {
        params: {
          ids: cryptos.map(item => item._id).filter(item => !!item).join(','),
          vs_currencies: CURRENCIES.join(','),
        },
      });
      logs.push(`crypto update prices - load prices from coingecko (chunk #${page}) - finish`);

      const operations = [];
      const updatedAt = new Date();

      for (const coingeckoId in data) {
        const prices = {};
        for (const currency in data[coingeckoId]) {
          prices[currency.toUpperCase()] = data[coingeckoId][currency];
        }
        operations.push({
          updateMany: {
            filter: { 'coingecko.id': coingeckoId },
            update: {
              $set: {
                prices,
                'updated_at.prices': updatedAt,
              },
            },
          },
        });
        //console.log(`updated crypto prices coingecko id: ${coingeckoId}`);
      }

      logs.push(`crypto update prices - update db (chunk #${page}) - start`);
      if (operations.length > 0) {
        await db.collection(COLLECTION)
          .bulkWrite(operations, { ordered: false });
      }
      logs.push(`crypto update prices - update db (chunk #${page}) - finish`);

      page++;
    } while (cryptos.length === PER_PAGE);
  } finally {
    clearTimeout(timeout);
  }
  console.log('crypto update prices - fineshed');
}

async function updateRank() {
  console.log('crypto update rank - started');
  const logs = ['SLOW RANK UPDATE'];
  const timeout = setTimeout(() => {
    console.error(logs.join('\n'));
  }, 10 * 60 * 1000 /* 10 min */);
  const PER_PAGE = 5000;
  let page = 0;
  let list;
  let map = [];

  try {
    do {
      logs.push(`crypto update rank - load from coinmarketcap (chunk #${page}) - start`);
      const res = await coinmarketcap.get('/v1/cryptocurrency/map', {
        params: {
          listing_status: 'active,inactive,untracked',
          limit: PER_PAGE,
          start: (page * PER_PAGE) + 1,
        },
      });
      logs.push(`crypto update rank - load from coinmarketcap (chunk #${page}) - finish`);
      list = res.data.data;
      page++;
      map = map.concat(list);
    } while (list.length === PER_PAGE);

    logs.push('crypto update rank - load from db - start');
    const updatedAt = new Date();
    const cursor = db.collection(COLLECTION)
      .aggregate([{
        $match: {
          deprecated: false,
        },
      }, {
        $group: {
          _id: '$coinmarketcap.id',
        },
      }, {
        $sort: {
          _id: 1,
        },
      }]);
    const operations = [];

    for await (const cmc of cursor) {
      const info = map.find((item) => item.id === cmc._id);
      operations.push({
        updateMany: {
          filter: { 'coinmarketcap.id': cmc._id },
          update: {
            $set: {
              rank: (info && info.rank) || Infinity,
              'updated_at.rank': updatedAt,
            },
          },
        },
      });
      //console.log(`updated crypto rank coinmarketcap id: ${cmc._id}`);
    }
    logs.push('crypto update rank - load from db - finish');

    logs.push('crypto update rank - update db - start');
    if (operations.length > 0) {
      await db.collection(COLLECTION)
        .bulkWrite(operations, { ordered: false });
    }
    logs.push('crypto update rank - update db - finish');
  } finally {
    clearTimeout(timeout);
  }
  console.log('crypto update rank - finished');
}

async function getAll(limit = 0) {
  const cryptos = await db.collection(COLLECTION)
    .find({
      deprecated: false,
    }, {
      limit,
      sort: {
        rank: 1,
      },
      projection: {
        synchronized_at: false,
        updated_at: false,
        deprecated: false,
        prices: false,
      },
    })
    .toArray();
  return cryptos;
}

async function getAllV4(limit = 0) {
  const cryptos = await db.collection(COLLECTION)
    .find({}, {
      limit,
      sort: {
        rank: 1,
      },
      projection: {
        synchronized_at: false,
        updated_at: false,
        prices: false,
      },
    })
    .toArray();
  return cryptos;
}

function getTicker(id) {
  return db.collection(COLLECTION)
    .findOne({
      _id: id,
      // 7 days ago
      'updated_at.prices': { $gte: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) },
    }, {
      projection: {
        prices: 1,
      },
    });
}

function getTickers(ids) {
  return db.collection(COLLECTION)
    .find({
      _id: { $in: ids },
      // 7 days ago
      'updated_at.prices': { $gte: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) },
    }, {
      sort: {
        rank: 1,
      },
      projection: {
        prices: 1,
      },
    })
    .sort()
    .toArray();
}

async function getTickersPublic(ids) {
  const tickers = await db.collection(COLLECTION)
    .find({
      $or: ids.map((id) => {
        const [asset, platform] = id.split('@');
        if (['ethereum', 'binance-smart-chain', 'avalanche-c-chain', 'polygon'].includes(platform)
          && /^0x[a-fA-F0-9]{40}$/.test(asset)) {
          // ETH, BSC, AVAX, POLYGON address
          return {
            address: asset.toLowerCase(),
            platform,
          };
        } else if (['tron'].includes(platform)
          && /^T[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{33}$/.test(asset)) {
          // Tron address
          return {
            address: asset,
            platform,
          };
        } else if (['solana'].includes(platform)
          && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(asset)) {
          // Solana address
          return {
            address: asset,
            platform,
          };
        } else {
          return {
            _id: id,
          };
        }
      }),
      // 7 days ago
      'updated_at.prices': { $gte: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) },
    }, {
      projection: {
        prices: 1,
        address: 1,
        platform: 1,
      },
    })
    .toArray();

  return ids.map((id) => {
    for (const ticker of tickers) {
      if (id === ticker._id) {
        return {
          _id: ticker._id,
          prices: ticker.prices,
        };
      } else if (id === `${ticker.address}@${ticker.platform}`) {
        return {
          _id: `${ticker.address}@${ticker.platform}`,
          prices: ticker.prices,
        };
      }
    }
  }).filter(Boolean);
}

export default {
  sync,
  updatePrices,
  updateRank,
  getAll,
  getAllV4,
  getTicker,
  getTickers,
  getTickersPublic,
};
