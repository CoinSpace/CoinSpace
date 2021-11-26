import axios from 'axios';
import crypto from 'crypto';
import createError from 'http-errors';
import Big from 'big.js';
const API_URL = 'https://api.changelly.com';
import cryptoDB from '@coinspace/crypto-db';

const {
  CHANGELLY_API_SECRET,
  CHANGELLY_API_KEY,
} = process.env;

async function request(method, params) {
  const message = {
    jsonrpc: '2.0',
    id: 'cs',
    method,
    params,
  };
  const sign = crypto.createHmac('sha512', CHANGELLY_API_SECRET).update(JSON.stringify(message)).digest('hex');
  const response = await axios({
    method: 'post',
    url: API_URL,
    headers: {
      'api-key': CHANGELLY_API_KEY,
      sign,
    },
    data: message,
  });
  return response && response.data && response.data.result;
}

function isGreater36hours(tx) {
  return (new Date() - new Date(tx.createdAt * 1000)) > 36 * 60 * 60 * 1000;
}

function getCrypto(id) {
  const item = cryptoDB.find((item) => item._id === id);
  if (!(item && item.changelly && item.changelly.ticker)) {
    throw createError(400, `'${id}' crypto not supported`);
  }
  return item;
}

function normalizeNumber(n, decimals) {
  return new Big(n).round(decimals ?? 8).toFixed();
}

async function getPairsParams(from, to) {
  const fromCrypto = getCrypto(from);
  const toCrypto = getCrypto(to);
  const data = await request('getPairsParams', [{
    from: fromCrypto.changelly.ticker,
    to: toCrypto.changelly.ticker,
  }]);
  if (!data) {
    throw createError(400, 'Exchange is currently unavailable for this pair');
  }
  return {
    minAmount: normalizeNumber(data[0].minAmountFloat, fromCrypto.decimals),
    maxAmount: normalizeNumber(data[0].maxAmountFloat, fromCrypto.decimals),
  };
}

async function estimate(from, to, value) {
  const fromCrypto = getCrypto(from);
  const toCrypto = getCrypto(to);
  const data = await request('getExchangeAmount', [{
    from: fromCrypto.changelly.ticker,
    to: toCrypto.changelly.ticker,
    amount: value,
  }]);
  if (!data) {
    return {
      rate: '0',
      result: '0',
    };
  }
  const networkFee = new Big(data[0].networkFee);
  const amount = new Big(data[0].amount);
  const result = new Big(data[0].result);
  return {
    rate: amount.eq(0) ? '0' : normalizeNumber(result.minus(networkFee).div(amount), toCrypto.decimals),
    result: normalizeNumber(result, toCrypto.decimals),
  };
}

async function validateAddress(address, id) {
  const item = getCrypto(id);
  const data = await request('validateAddress', {
    address,
    currency: item.changelly.ticker,
  });
  return {
    isValid: data ? data.result : false,
  };
}

async function createTransaction(from, to, amount, address, refundAddress) {
  const fromCrypto = getCrypto(from);
  const toCrypto = getCrypto(to);
  const data = await request('createTransaction', {
    from: fromCrypto.changelly.ticker,
    to: toCrypto.changelly.ticker,
    amount,
    address,
    refundAddress,
  });
  if (!data) {
    throw createError(500, 'Transaction not created');
  }
  return {
    id: data.id,
    depositAmount: normalizeNumber(data.amountExpectedFrom),
    depositAddress: data.payinAddress,
    extraId: data.payinExtraId,
  };
}

async function getTransaction(id) {
  const txs = await request('getTransactions', {
    id,
  });
  const tx = txs && txs[0];
  if (!tx) {
    throw createError(404, 'Transaction not found');
  }
  let { status } = tx;
  if (status === 'waiting' && isGreater36hours(tx)) {
    status = 'overdue';
  }
  return {
    amountTo: tx.amountTo,
    status,
    ...(status === 'finished' ? {
      payoutHashLink: tx.payoutHashLink,
      payoutHash: tx.payoutHash,
    } : {}),
  };
}

async function getTransactions(id, currency, address, limit, offset) {
  const txs = await request('getTransactions', {
    id,
    currency,
    address,
    limit,
    offset,
  });

  return txs.map((tx) => {
    let { status } = tx;
    if (status === 'waiting' && isGreater36hours(tx)) {
      status = 'overdue';
    }
    return {
      id: tx.id,
      trackUrl: tx.trackUrl,
      status,
      amountTo: tx.amountTo || '0',
      amountExpectedTo: tx.amountExpectedTo || '0',
      amountFrom: tx.amountFrom || '0',
      amountExpectedFrom: tx.amountExpectedFrom || '0',
      currencyFrom: tx.currencyFrom,
      currencyTo: tx.currencyTo,
      createdAt: new Date(tx.createdAt * 1000).toISOString(),
      payinAddress: tx.payinAddress,
      payinHash: tx.payinHash || undefined,
      payoutAddress: tx.payoutAddress,
      payoutHashLink: tx.payoutHashLink || undefined,
      payoutHash: tx.payoutHash || undefined,
    };
  });
}

export default {
  getPairsParams,
  estimate,
  validateAddress,
  createTransaction,
  getTransaction,
  getTransactions,
};
