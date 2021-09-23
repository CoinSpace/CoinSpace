import db from './db.js';
import createError from 'http-errors';

const COLLECTION = 'cryptos';

function id2Asset(id) {
  if (id === 'bitcoincash') return 'bitcoin-cash';
  if (id === 'bitcoinsv') return 'bitcoin-sv';
  if (id === 'binancecoin') return 'binance-smart-chain';
  return id;
}

function asset2Id(asset) {
  if (asset === 'bitcoin-cash') return 'bitcoincash';
  if (asset === 'bitcoin-sv') return 'bitcoinsv';
  if (asset === 'binance-smart-chain') return 'binancecoin';
  return asset;
}

async function getTokens(networks, limit = 0) {
  const tokens = await db.collection(COLLECTION)
    .find({
      platform: { $in: networks },
      type: 'token',
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

  return tokens.map((token) => {
    return {
      _id: asset2Id(token.asset),
      name: token.name,
      symbol: token.symbol,
      address: token.address,
      decimals: token.decimals,
      icon: `${process.env.SITE_URL}/assets/crypto/${token.logo}?v=${process.env.npm_package_version}`,
      market_cap_rank: token.rank,
      network: token.platform,
    };
  });
}

function getTicker(id) {
  return db.collection(COLLECTION)
    .findOne({
      asset: id2Asset(id),
    }, {
      projection: {
        asset: 1,
        prices: 1,
      },
    })
    .then((doc) => {
      if (!doc) {
        throw createError(404, 'Coin or token not found');
      }
      return {
        _id: asset2Id(doc.asset),
        prices: doc.prices,
      };
    });
}

function getTickers(ids) {
  return db.collection(COLLECTION)
    .find({
      asset: { $in: ids.map(id2Asset) },
    }, {
      projection: {
        asset: 1,
        prices: 1,
      },
    })
    .toArray()
    .then((docs) => {
      return docs.map((doc) => {
        return {
          _id: asset2Id(doc.asset),
          prices: doc.prices,
        };
      });
    });
}

// For backward compatibility
function fixSatoshi(doc) {
  if (doc._id === 'bitcoin@bitcoin') {
    doc['prices']['mBTC'] = 1000;
    doc['prices']['μBTC'] = 1000000;
  } else if (doc._id === 'bitcoin-cash@bitcoin-cash') {
    doc['prices']['mBCH'] = 1000;
    doc['prices']['μBCH'] = 1000000;
  } else if (doc._id === 'bitcoin-sv@bitcoin-sv') {
    doc['prices']['mBSV'] = 1000;
    doc['prices']['μBSV'] = 1000000;
  }
}

// For backward compatibility
async function getFromCacheForAppleWatch() {
  const tickers = {
    'bitcoin@bitcoin': 'BTC',
    'bitcoin-cash@bitcoin-cash': 'BCH',
    'litecoin@litecoin': 'LTC',
    'ethereum@ethereum': 'ETH',
  };
  return await db.collection(COLLECTION)
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

export default {
  getTokens,
  getTicker,
  getTickers,
  // For backward compatibility
  getFromCacheForAppleWatch,
};
