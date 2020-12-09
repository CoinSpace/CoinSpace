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

async function estimatesmartfee(cryptoId) {
  const api = API[cryptoId];
  try {
    return {
      minimum: coinPerKilobyte2satPerByte((await axios.get(`${api}estimatesmartfee?target=12`)).data.feerate),
      default: coinPerKilobyte2satPerByte((await axios.get(`${api}estimatesmartfee?target=6`)).data.feerate),
      fastest: coinPerKilobyte2satPerByte((await axios.get(`${api}estimatesmartfee?target=2`)).data.feerate),
    };
  } catch (err) {
    console.log(`${cryptoId} estimatesmartfee:`, err.message);
    return null;
  }
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

const ADAPTERS = {
  bitcoin: estimatesmartfee,
  bitcoincash: estimatefee,
  bitcoinsv: estimatefee,
  litecoin: estimatesmartfee,
  dogecoin: estimatesmartfee,
  dash: estimatesmartfee,
};

async function updateFees() {
  for (const id of CRYPTO) {
    const item = await db().collection('fee')
      .findOne({ _id: id });
    if (item && item.manual === true) {
      // Not update fee
      continue;
    }

    const fee = await ADAPTERS[id](id);
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
  return items;
}

module.exports = {
  updateFees,
  getFees,
};
