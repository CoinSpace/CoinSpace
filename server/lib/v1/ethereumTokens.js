'use strict';

const axios = require('axios');
const db = require('./db');
const limit = 50;

function save(tokens) {
  const operations = tokens.map((token) => {
    return { replaceOne: { filter: { _id: token._id }, replacement: token, upsert: true } };
  });

  const collection = db().collection('ethereum_tokens');
  return Promise.all([
    collection.bulkWrite(operations),
    collection.deleteMany({ _id: { $gte: tokens.length } }),
  ]);
}

function getFromAPI() {
  return axios({
    url: 'https://api.ethplorer.io/getTop',
    params: {
      apiKey: process.env.ETHPLORER_API_KEY,
      criteria: 'cap',
      limit,
    },
  }).then((response) => {
    if (!response.data) throw new Error('Bad ethereumTokens response');
    let rank = 0;
    return response.data.tokens.filter((token) => {
      if (token.symbol === 'ETH') return false;
      if (token.symbol === 'USDT') return false;
      return true;
    }).map((item) => {
      return {
        _id: rank++,
        address: item.address,
        name: item.name,
        decimals: parseInt(item.decimals),
        symbol: item.symbol,
        price: item.price ? parseFloat(item.price.rate) : 0.0,
      };
    });
  });
}

function getAllFromCache() {
  const collection = db().collection('ethereum_tokens');
  return collection
    .find({}, { projection: { _id: 0 } })
    .sort({ symbol: 1 })
    .limit(limit)
    .toArray();
}

module.exports = {
  save,
  getFromAPI,
  getAllFromCache,
};
