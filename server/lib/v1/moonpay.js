import axios from 'axios';
import db from '../db.js';

const API_KEY = process.env.MOONPAY_API_KEY;

function save(_id, data) {
  const collection = db.collection('moonpay');
  return collection.updateOne({ _id }, { $set: { data } }, { upsert: true });
}

const PREDEFINED_NETWORKS = {
  // eslint-disable-next-line max-len
  ethereum: ['aave', 'axs', 'band', 'bat', 'bora', 'cbc', 'chz', 'comp', 'cvc', 'dai', 'enj', 'eth', 'fun', 'keth', 'key', 'link', 'mana', 'matic', 'mkr', 'ocean', 'okb', 'om', 'omg', 'pax', 'paxg', 'rep', 'rfuel', 'rinketh', 'sand', 'snx', 'srm', 'stmx', 'tomo', 'tusd', 'uni', 'usdc', 'usdt', 'utk', 'wbtc', 'zrx'],
  'binance-chain': ['ava', 'bnb', 'busd', 'rune'],
  'binance-smart-chain': ['bnb_bsc', 'busd_bsc'],
  eos: ['eos', 'eosdt'],
  tron: ['btt', 'trx'],
  polygon: ['eth_polygon', 'matic_polygon', 'usdc_polygon'],
  ripple: ['xrp'],
  bitcoincash: ['bch'],
  bitcoinsv: ['bsv'],
};

function detectNetwork(item) {
  for (const network in PREDEFINED_NETWORKS) {
    if (PREDEFINED_NETWORKS[network].includes(item.code)) {
      return network;
    }
  }
  return item.name.toLowerCase().replace(/\s/g, '-');
}

function getCurrenciesFromAPI() {
  return axios.get('https://api.moonpay.com/v3/currencies', {
    params: {
      apiKey: API_KEY,
    },
  }).then((response) => {
    const { data } = response;
    if (!data || !data.length) throw new Error('Bad moonpay response');

    const coins = {};
    const coinsUSA = {};
    data.forEach((coin) => {
      if (coin.type === 'crypto') {
        const network = detectNetwork(coin);
        const symbol = coin.code.split('_')[0].toUpperCase();
        coins[coin.id] = {
          code: coin.code,
          symbol,
          isSupported: !coin.isSuspended,
          isSellSupported: coin.isSellSupported && process.env.ENABLE_MOONPAY_SELL === 'true',
          network,
        };
        coinsUSA[coin.id] = {
          code: coin.code,
          symbol,
          isSupported: !coin.isSuspended && coin.isSupportedInUS,
          isSellSupported: coin.isSellSupported && process.env.ENABLE_MOONPAY_SELL === 'true',
          network,
        };
      }
    });

    const fiat = {};
    data.forEach((item) => {
      if (item.type === 'fiat') {
        fiat[item.id] = {
          symbol: item.code.toUpperCase(),
          sign: '', // deprecated
          precision: item.precision,
          minAmount: item.minAmount || 20,
          maxAmount: item.maxAmount || 2200,
        };
      }
    });

    return {
      coins,
      coins_usa: coinsUSA,
      fiat,
    };
  });
}

function getCountriesFromAPI() {
  return axios.get('https://api.moonpay.com/v3/countries').then((response) => {
    const { data } = response;
    if (!data || !data.length) throw new Error('Bad moonpay response');

    const document = data.filter((country) => {
      return country.supportedDocuments && country.supportedDocuments.length > 0;
    }).map((country) => {
      return {
        code: country.alpha3,
        name: country.name,
        supportedDocuments: country.supportedDocuments,
      };
    });

    const allowed = data.filter((country) => {
      return country.isAllowed;
    }).map((country) => {
      const item = {};
      item.code = country.alpha3;
      item.name = country.name;
      if (country.states) {
        item.states = country.states.filter((state) => {
          return state.isAllowed;
        }).map((state) => {
          return {
            code: state.code,
            name: state.name,
          };
        });
      }
      return item;
    });

    return {
      document,
      allowed,
    };
  });
}

function getFromCache(id) {
  const collection = db.collection('moonpay');
  return collection
    .find({ _id: id })
    .limit(1)
    .next().then((item) => {
      if (!item) return {};
      delete item.id;
      return item.data;
    });
}

export default {
  save,
  getCurrenciesFromAPI,
  getCountriesFromAPI,
  getFromCache,
};
