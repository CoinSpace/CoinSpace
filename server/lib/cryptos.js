import cryptoDB from '@coinspace/crypto-db';
import coingecko from './coingecko.js';
import coinmarketcap from './coinmarketcap.js';
import db from './db.js';

const COLLECTION = 'cryptos';
const CURRENCIES = [
  'ARS', 'AUD', 'BRL', 'CAD', 'CHF', 'CNY',
  'DKK', 'EUR', 'GBP', 'IDR', 'ILS',
  'JPY', 'MXN', 'NOK', 'NZD', 'PLN',
  'RUB', 'SEK', 'SGD', 'TRY', 'UAH',
  'USD', 'ZAR',
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
  const PER_PAGE = 500;
  let page = 0;
  let cryptos;
  do {
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

    if (cryptos.length === 0) {
      break;
    }

    const { data } = await coingecko.get('/simple/price', {
      params: {
        ids: cryptos.map(item => item._id).filter(item => !!item).join(','),
        vs_currencies: CURRENCIES.join(','),
      },
    });

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

    if (operations.length > 0) {
      await db.collection(COLLECTION)
        .bulkWrite(operations, { ordered: false });
    }

    page++;
  } while (cryptos.length === PER_PAGE);

  console.log('crypto update prices - fineshed');
}

async function updateRank() {
  console.log('crypto update rank - started');
  const PER_PAGE = 5000;
  let page = 0;
  let list;
  let map = [];

  do {
    const res = await coinmarketcap.get('/v1/cryptocurrency/map', {
      params: {
        listing_status: 'active,inactive,untracked',
        limit: PER_PAGE,
        start: (page * PER_PAGE) + 1,
      },
    });
    list = res.data.data;
    page++;
    map = map.concat(list);
  } while (list.length === PER_PAGE);

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

  if (operations.length > 0) {
    await db.collection(COLLECTION)
      .bulkWrite(operations, { ordered: false });
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
        if (['ethereum', 'binance-smart-chain'].includes(platform)
          && /^0x[a-fA-F0-9]{40}$/.test(asset)) {
          // ETH or BSC address
          return {
            address: asset.toLowerCase(),
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
  getTicker,
  getTickers,
  getTickersPublic,
};
