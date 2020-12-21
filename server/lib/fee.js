'use strict';

const axios = require('axios');
const createError = require('http-errors');
const db = require('./v1/db');

const CRYPTO = [
  'bitcoin',
  'bitcoincash',
  'bitcoinsv',
  'litecoin',
  'dogecoin',
  'dash',
];
const API = {
  bitcoin: process.env.API_BTC_URL,
  bitcoincash: process.env.API_BCH_URL,
  bitcoinsv: process.env.API_BSV_URL,
  litecoin: process.env.API_LTC_URL,
  dogecoin: process.env.API_DOGE_URL,
  dash: process.env.API_DASH_URL,
};

function coinPerKilobyte2satPerByte(bitcoinPerKilobyte) {
  return Math.round(bitcoinPerKilobyte * 1e8 / 1e3);
}

async function estimatefee(cryptoId) {
  const api = API[cryptoId];
  try {
    return {
      minimum: coinPerKilobyte2satPerByte((await axios.get(`${api}estimatefee?target=12`)).data),
      default: coinPerKilobyte2satPerByte((await axios.get(`${api}estimatefee?target=6`)).data),
      fastest: coinPerKilobyte2satPerByte((await axios.get(`${api}estimatefee?target=2`)).data),
    };
  } catch (err) {
    console.log(`${cryptoId} estimatefee:`, err.message);
    return null;
  }
}

async function updateFees() {
  for (const id of CRYPTO) {
    const item = await db().collection('fee')
      .findOne({ _id: id });
    if (item && item.manual === true) {
      // Not update fee
      continue;
    }

    const fee = await estimatefee(id);
    if (fee) {
      await db().collection('fee')
        .updateOne({
          _id: id,
        }, {
          $set: { fee },
        }, { upsert: true });
      console.log(`${id} updated:`, fee);
    } else {
      console.error(`${id} not updated!`);
    }
  }
}

async function getFees(cryptoId) {
  if (!CRYPTO.includes(cryptoId)) {
    throw createError(400, 'Coin fee is not supported');
  }
  const fees = await db().collection('fee')
    .findOne({ _id: cryptoId });
  if (!fees) {
    throw createError(404, 'Coin fee was not found');
  }
  const items = [{
    name: 'default',
    value: fees.fee.default,
    default: true,
  }];
  if (fees.fee.minimum !== fees.fee.default) {
    items.unshift({
      name: 'minimum',
      value: fees.fee.minimum,
    });
  }
  if (fees.fee.fastest !== fees.fee.default) {
    items.push({
      name: 'fastest',
      value: fees.fee.fastest,
    });
  }
  return { items };
}

module.exports = {
  updateFees,
  getFees,
};
