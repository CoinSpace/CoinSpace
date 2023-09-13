import Big from 'big.js';
import createError from 'http-errors';
import db from './db.js';

async function getCsFee(cryptoId) {
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

async function getCsFeeV4(cryptoId) {
  const csFee = await db.collection('cs_fee')
    .findOne({ _id: cryptoId });
  if (!csFee) {
    throw createError(404, 'CS fee was not found');
  }
  return {
    fee: csFee.fee,
    minFee: csFee.min_usd,
    maxFee: csFee.max_usd,
    rbfFee: csFee.rbf_usd,
    address: csFee.addresses[0],
    feeAddition: csFee.fee_addition || 0,
  };
}

async function getCsFeeAddressesV4(cryptoId) {
  const csFee = await db.collection('cs_fee')
    .findOne({ _id: cryptoId });
  if (!csFee) {
    throw createError(404, 'CS fee was not found');
  }
  return csFee.addresses;
}

export default {
  getCsFee,
  getCsFeeV4,
  getCsFeeAddressesV4,
};
