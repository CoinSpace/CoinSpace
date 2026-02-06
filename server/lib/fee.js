import axios from 'axios';
import createError from 'http-errors';
import db from './db.js';

const API = {
  'bitcoin@bitcoin': process.env.API_BTC_URL,
  'bitcoin-cash@bitcoin-cash': process.env.API_BCH_URL,
  'litecoin@litecoin': process.env.API_LTC_URL,
  'dogecoin@dogecoin': process.env.API_DOGE_URL,
  'dash@dash': process.env.API_DASH_URL,
};
const CRYPTO = Object.keys(API);

async function estimatefee(cryptoId) {
  const api = API[cryptoId];
  try {
    return (await axios.get(`${api}fees`)).data;
  } catch (err) {
    console.log(`${cryptoId} estimatefee:`, err.message);
    return null;
  }
}

async function updateFees() {
  for (const id of CRYPTO) {
    const item = await db.collection('fee')
      .findOne({ _id: id });
    if (item && item.manual === true) {
      // Not update fee
      continue;
    }

    const fee = await estimatefee(id);
    if (fee) {
      await db.collection('fee')
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
  const fees = await db.collection('fee')
    .findOne({ _id: cryptoId });
  if (!fees) {
    throw createError(404, 'Coin fee was not found');
  }
  return { items: fees.fee };
}

export default {
  updateFees,
  getFees,
};
