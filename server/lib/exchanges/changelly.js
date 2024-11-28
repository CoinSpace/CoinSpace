import Big from 'big.js';
import axios from 'axios';
import createError from 'http-errors';
import crypto from 'crypto';
import cryptoDB from '@coinspace/crypto-db';
import { normalizeNumber } from '../utils.js';

const privateKey = crypto.createPrivateKey({
  key: process.env.CHANGELLY_API_SECRET,
  format: 'der',
  type: 'pkcs8',
  encoding: 'hex',
});

const publicKey = crypto.createPublicKey(privateKey).export({
  type: 'pkcs1',
  format: 'der',
});

const CHANGELLY_API_KEY = crypto.createHash('sha256').update(publicKey).digest('base64');
const API_URL = 'https://api.changelly.com/v2';

async function request(method, params) {
  const message = {
    jsonrpc: '2.0',
    id: 'cs',
    method,
    params,
  };
  const signature = crypto.sign('sha256', Buffer.from(JSON.stringify(message)), {
    key: privateKey,
    type: 'pkcs8',
    format: 'der',
  }).toString('base64');

  const response = await axios({
    method: 'post',
    url: API_URL,
    headers: {
      'X-Api-Key': CHANGELLY_API_KEY,
      'X-Api-Signature': signature,
    },
    data: message,
  });
  return response && response.data;
}

function isGreater3hours(tx) {
  return (new Date() - new Date(Math.round(tx.createdAt / 1000))) > 3 * 60 * 60 * 1000;
}

function getCrypto(id) {
  const item = cryptoDB.find((item) => item._id === id);
  if (!(item && item.changelly && item.changelly.ticker)) {
    throw createError(400, `'${id}' crypto not supported`);
  }
  return item;
}

function getCryptoByChangelly(id) {
  const item = cryptoDB.find((item) => item?.changelly?.ticker === id);
  return item;
}

async function getPairsParamsV3(from, to) {
  const fromCrypto = getCrypto(from);
  const toCrypto = getCrypto(to);
  const { result: data } = await request('getPairsParams', [{
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

async function estimateV3(from, to, value) {
  const fromCrypto = getCrypto(from);
  const toCrypto = getCrypto(to);
  const { result: data } = await request('getExchangeAmount', {
    from: fromCrypto.changelly.ticker,
    to: toCrypto.changelly.ticker,
    amountFrom: value,
  });
  if (!data) {
    return {
      rate: '0',
      result: '0',
    };
  }
  const networkFee = Big(data[0].networkFee);
  const amount = Big(data[0].amountFrom);
  const result = Big(data[0].amountTo).minus(networkFee);
  return {
    rate: amount.eq(0) ? '0' : normalizeNumber(result.div(amount), toCrypto.decimals),
    result: normalizeNumber(result, toCrypto.decimals),
  };
}

export async function estimate({ from, to, amount }) {
  const fromCrypto = getCrypto(from);
  const toCrypto = getCrypto(to);

  const data = await request('getExchangeAmount', {
    from: fromCrypto.changelly.ticker,
    to: toCrypto.changelly.ticker,
    amountFrom: amount,
  });
  if (data.error) {
    if (data.error.code === -32600 || data.error.code === -32602) {
      if (/minimal amount/i.test(data.error.message)) {
        const amount = data.error.message.match(/\s(\d+(?:\.\d+)?)\s/i)?.[1];
        return {
          error: 'SmallAmountError',
          amount: amount && normalizeNumber(amount, fromCrypto.decimals),
        };
      }
      if (/maximum amount/i.test(data.error.message)) {
        const amount = data.error.message.match(/\s(\d+(?:\.\d+)?)\s/i)?.[1];
        return {
          error: 'BigAmountError',
          amount: amount && normalizeNumber(amount, fromCrypto.decimals),
        };
      }
      if (/invalid amount/i.test(data.error.message)) {
        return {
          error: 'AmountError',
        };
      }
      if (/disabled/i.test(data.error.message)) {
        return {
          error: 'ExchangeDisabled',
        };
      }
    }
    if (data.error.code === -32603) {
      throw createError(500, data.error.message);
    }
    throw createError(400, data.error.message);
  }
  if (!data?.result?.[0]) {
    return {
      error: 'ExchangeDisabled',
    };
  }
  const estimation = data.result[0];
  const networkFee = Big(estimation.networkFee);
  const amountFrom = Big(estimation.amountFrom);
  const result = Big(estimation.amountTo).minus(networkFee);
  return {
    rate: amountFrom.eq(0) ? '0' : normalizeNumber(result.div(amountFrom), toCrypto.decimals),
    result: normalizeNumber(result, toCrypto.decimals),
  };
}

async function validateAddressV3(address, id, extraId) {
  const item = getCrypto(id);
  const { result: data } = await request('validateAddress', {
    address,
    extraId,
    currency: item.changelly.ticker,
  });
  return {
    isValid: data ? data.result : false,
  };
}

export async function validateAddress({ cryptoId, address, extraId }) {
  const item = getCrypto(cryptoId);
  const { result: data } = await request('validateAddress', {
    address,
    extraId,
    currency: item.changelly.ticker,
  });
  return {
    isValid: data ? data.result : false,
  };
}

async function createTransactionV3(from, to, amountFrom, address, refundAddress, extraId) {
  const fromCrypto = getCrypto(from);
  const toCrypto = getCrypto(to);
  const data = await request('createTransaction', {
    from: fromCrypto.changelly.ticker,
    to: toCrypto.changelly.ticker,
    amountFrom,
    address,
    extraId,
    refundAddress,
  });
  if (!data.result) {
    throw createError(500, 'Transaction not created');
  }
  return {
    id: data.result.id,
    depositAmount: normalizeNumber(data.result.amountExpectedFrom),
    depositAddress: data.result.payinAddress,
    extraId: data.result.payinExtraId,
  };
}

export async function createTransaction({ from, to, amount, address, extraId, refundAddress }) {
  const fromCrypto = getCrypto(from);
  const toCrypto = getCrypto(to);
  const data = await request('createTransaction', {
    from: fromCrypto.changelly.ticker,
    to: toCrypto.changelly.ticker,
    amountFrom: amount,
    address,
    extraId,
    refundAddress,
  });
  if (!data.result) {
    throw createError(500, 'Transaction not created');
  }
  return {
    id: data.result.id,
    depositAmount: normalizeNumber(data.result.amountExpectedFrom),
    depositAddress: data.result.payinAddress,
    extraId: data.result.payinExtraId,
  };
}

async function getTransactionV3(id) {
  const { result: txs } = await request('getTransactions', {
    id,
  });
  const tx = txs && txs[0];
  if (!tx) {
    throw createError(404, 'Transaction not found');
  }
  let { status } = tx;
  if (status === 'waiting' && isGreater3hours(tx)) {
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

async function getTransactionsV3(id, currency, address, limit, offset) {
  const { result: txs } = await request('getTransactions', {
    id,
    currency,
    address,
    limit,
    offset,
  });

  return txs.map((tx) => {
    let { status } = tx;
    if (status === 'waiting' && isGreater3hours(tx)) {
      status = 'overdue';
    }
    return {
      id: tx.id,
      trackUrl: `mailto:support@changelly.com?subject=Changelly transaction ${tx.id}`,
      status,
      amountTo: tx.amountTo || '0',
      amountExpectedTo: tx.amountExpectedTo || '0',
      amountFrom: tx.amountFrom || '0',
      amountExpectedFrom: tx.amountExpectedFrom || '0',
      currencyFrom: tx.currencyFrom,
      currencyTo: tx.currencyTo,
      createdAt: new Date(Math.round(tx.createdAt / 1000)).toISOString(),
      payinAddress: tx.payinAddress,
      payinHash: tx.payinHash || undefined,
      payoutAddress: tx.payoutAddress,
      payoutHashLink: tx.payoutHashLink || undefined,
      payoutHash: tx.payoutHash || undefined,
      refundAddress: tx.refundAddress || undefined,
    };
  });
}

export async function getTransactions({ ids }) {
  const data = await request('getTransactions', {
    id: ids,
    limit: 100,
  });
  if (!data.result) {
    throw createError(500, data.error?.message || 'Exchange error');
  }
  return data.result.map((tx) => {
    let { status } = tx;
    if (status === 'waiting' && isGreater3hours(tx)) {
      status = 'overdue';
    }
    return {
      id: tx.id,
      trackUrl: `mailto:support@changelly.com?subject=Changelly transaction ${tx.id}`,
      status,
      amountTo: tx.amountTo || '0',
      amountExpectedTo: tx.amountExpectedTo || '0',
      amountFrom: tx.amountFrom || '0',
      amountExpectedFrom: tx.amountExpectedFrom || '0',
      cryptoFrom: getCryptoByChangelly(tx.currencyFrom)._id,
      cryptoTo: getCryptoByChangelly(tx.currencyTo)._id,
      createdAt: new Date(Math.round(tx.createdAt / 1000)).toISOString(),
      payinAddress: tx.payinAddress,
      payinHash: tx.payinHash || undefined,
      payoutAddress: tx.payoutAddress,
      payoutHashLink: tx.payoutHashLink || undefined,
      payoutHash: tx.payoutHash || undefined,
      refundAddress: tx.refundAddress || undefined,
      refundHash: tx.refundHash || undefined,
      refundHashLink: tx.refundHashLink || undefined,
    };
  });
}

export default {
  getPairsParamsV3,
  estimateV3,
  validateAddressV3,
  createTransactionV3,
  getTransactionV3,
  getTransactionsV3,
};
