import db from './db.js';

const COLLECTION = 'cryptos';

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
        deprecated: 1,
        rank: 1,
        original: -1,
        _id: 1,
      },
      projection: {
        synchronized_at: false,
        updated_at: false,
        prices: false,
        change: false,
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

async function getMarket(coingeckoIds, currency) {
  const data = await db.collection(COLLECTION)
    .aggregate([{
      $match: {
        'coingecko.id': { $in: coingeckoIds },
        // 7 days ago
        'updated_at.prices': { $gte: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) },
      },
    }, {
      $sort: { 'updated_at.prices': -1 },
    }, {
      $group: {
        _id: '$coingecko.id',
        prices: { $first: '$prices' },
        change: { $first: '$change' },
      },
    }]).toArray();
  return data.map((item) => {
    return {
      id: item._id,
      current_price: item.prices[currency],
      price_change_percentage_24h_in_currency: item.change[currency],
    };
  });
}

export default {
  getAll,
  getAllV4,
  getTicker,
  getTickers,
  getTickersPublic,
  getMarket,
};
