'use strict';

const axios = require('axios');
const db = require('./db');
const API_KEY = process.env.MOONPAY_API_KEY;

function save(_id, data) {
  const collection = db().collection('moonpay');
  return collection.updateOne({ _id }, { $set: { data } }, { upsert: true });
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
        coins[coin.id] = {
          symbol: coin.code.toUpperCase(),
          isSupported: !coin.isSuspended,
          isSellSupported: coin.isSellSupported && process.env.ENABLE_MOONPAY_SELL === 'true',
        };
        coinsUSA[coin.id] = {
          symbol: coin.code.toUpperCase(),
          isSupported: !coin.isSuspended && coin.isSupportedInUS,
          isSellSupported: coin.isSellSupported && process.env.ENABLE_MOONPAY_SELL === 'true',
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
  const collection = db().collection('moonpay');
  return collection
    .find({ _id: id })
    .limit(1)
    .next().then((item) => {
      if (!item) return {};
      delete item.id;
      return item.data;
    });
}

module.exports = {
  save,
  getCurrenciesFromAPI,
  getCountriesFromAPI,
  getFromCache,
};
