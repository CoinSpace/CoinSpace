'use strict';

const createError = require('http-errors');
const db = require('./v1/db');
const tokens = require('./tokens');
const Big = require('big.js');

const CRYPTO = [
  'bitcoin',
  'bitcoincash',
  'bitcoinsv',
  'litecoin',
  'dogecoin',
  'dash',
  'monero',
];

async function getCsFee(cryptoId) {
  if (!CRYPTO.includes(cryptoId)) {
    throw createError(400, 'Currency cs fee is not supported');
  }

  const ticker = await tokens.getTicker(cryptoId);
  const csFee = await db().collection('cs_fee')
    .findOne({ _id: cryptoId });

  if (!csFee) {
    throw createError(404, 'CS fee was not found');
  }

  const rate = ticker['prices']['USD'];

  return {
    fee: csFee.fee,
    minFee: parseInt(Big(1).div(rate).times(csFee.min_usd).times(Big(10).pow(ticker.decimals)), 10),
    maxFee: parseInt(Big(1).div(rate).times(csFee.max_usd).times(Big(10).pow(ticker.decimals)), 10),
    rbfFee: parseInt(Big(1).div(rate).times(csFee.rbf_usd || 0).times(Big(10).pow(ticker.decimals)), 10),
    skipMinFee: csFee.skipMinFee || false,
    addresses: csFee.addresses,
    whitelist: csFee.whitelist,
  };
}

module.exports = {
  getCsFee,
};
