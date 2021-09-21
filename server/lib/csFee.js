import createError from 'http-errors';
import db from './db.js';
import Big from 'big.js';

const CRYPTO = [
  'bitcoin@bitcoin',
  'bitcoin-cash@bitcoin-cash',
  'bitcoin-sv@bitcoin-sv',
  'litecoin@litecoin',
  'dogecoin@dogecoin',
  'dash@dash',
  'monero@monero',
];

async function getCsFee(cryptoId) {
  if (!CRYPTO.includes(cryptoId)) {
    throw createError(400, 'Currency cs fee is not supported');
  }

  const ticker = await db.collection('cryptos')
    .findOne({
      _id: cryptoId,
    }, {
      projection: {
        prices: 1,
        decimals: 1,
      },
    });
  const csFee = await db.collection('cs_fee')
    .findOne({ _id: cryptoId });

  if (!csFee || !ticker) {
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
    whitelist: csFee.whitelist || [],
  };
}

export default {
  getCsFee,
};
