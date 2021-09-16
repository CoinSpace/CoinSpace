import cryptoDB from '@coinspace/crypto-db';
import coingecko from './coingecko.js';
import db from './db.js';

const COLLECTION = 'cryptos';
const CURRENCIES = [
  'AUD', 'BRL', 'CAD', 'CHF', 'CNY',
  'DKK', 'EUR', 'GBP', 'IDR', 'ILS',
  'JPY', 'MXN', 'NOK', 'NZD', 'PLN',
  'RUB', 'SEK', 'SGD', 'TRY', 'UAH',
  'USD', 'ZAR',
];
const CRYPTO_PROPS = ['coingecko', 'changelly', 'moonpay'];

async function sync() {
  console.time('crypto sync');
  for (const crypto of cryptoDB) {
    const update = {
      $set: {
        ...crypto,
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
  console.timeEnd('crypto sync');
}

async function updatePrices() {
  console.time('crypto update prices');

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
        ids: cryptos.map(item => item._id).join(','),
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
              updated_at: updatedAt,
            },
          },
        },
      });
      console.log(`updated crypto prices coingecko id: ${coingeckoId}`);
    }

    if (operations.length > 0) {
      await db.collection(COLLECTION)
        .bulkWrite(operations, { ordered: false });
    }

    page++;
  } while (cryptos.length === PER_PAGE);

  console.timeEnd('crypto update prices');
}

async function getAll(limit = 0) {
  //return CRYPTOS;
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
      },
    })
    .toArray();
  return cryptos;
}

export default {
  sync,
  updatePrices,
  getAll,
};
