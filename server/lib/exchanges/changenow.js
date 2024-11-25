import Big from 'big.js';
import axios from 'axios';
import createError from 'http-errors';
import cryptoDB from '@coinspace/crypto-db';
import {
  getUserId,
  normalizeNumber,
} from '../utils.js';

const { CHANGENOW_API_KEY } = process.env;

const changenow = axios.create({
  baseURL: 'https://api.changenow.io/v2/',
  timeout: 60 * 1000,
  headers: {
    'x-changenow-api-key': CHANGENOW_API_KEY,
  },
});

function getCrypto(id) {
  const item = cryptoDB.find((item) => item._id === id);
  if (!(item && item.changenow)) {
    throw createError(400, `'${id}' crypto not supported`);
  }
  return item;
}

function getCryptoByChangenow(network, ticker) {
  return cryptoDB.find((item) =>
    item?.changenow?.network === network && item?.changenow?.ticker === ticker);
}

function mapStatus(status) {
  switch (status) {
    case 'new':
    case 'waiting':
      return 'waiting';
    default:
      return status;
  }
}

export async function estimate({ from, to, amount }) {
  const fromCrypto = getCrypto(from);
  const toCrypto = getCrypto(to);

  const { data: { minAmount } } = await changenow({
    method: 'get',
    url: 'exchange/min-amount',
    params: {
      fromCurrency: fromCrypto.changenow.ticker,
      fromNetwork: fromCrypto.changenow.network,
      toCurrency: toCrypto.changenow.ticker,
      toNetwork: toCrypto.changenow.network,
      flow: 'standard',
    },
  });
  if (parseFloat(minAmount) > parseFloat(amount)) {
    return {
      error: 'SmallAmountError',
      amount: normalizeNumber(minAmount, fromCrypto.decimals),
    };
  }

  try {
    const { data } = await changenow({
      method: 'get',
      url: 'exchange/estimated-amount',
      params: {
        fromAmount: normalizeNumber(amount, fromCrypto.decimals),
        fromCurrency: fromCrypto.changenow.ticker,
        fromNetwork: fromCrypto.changenow.network,
        toCurrency: toCrypto.changenow.ticker,
        toNetwork: toCrypto.changenow.network,
        flow: 'standard',
      },
    });
    const fromAmount = Big(data.fromAmount);
    const toAmount = Big(data.toAmount);
    return {
      rate: fromAmount.eq(0) ? '0' : normalizeNumber(toAmount.div(fromAmount), toCrypto.decimals),
      result: normalizeNumber(toAmount, toCrypto.decimals),
    };
  } catch (err) {
    if (err.status === 400) {
      if (err.response?.data?.error === 'deposit_too_small' && err.response?.data?.payload?.range?.minAmount) {
        return {
          error: 'SmallAmountError',
          amount: normalizeNumber(err.response.data.payload.range.minAmount, fromCrypto.decimals),
        };
      }
      throw createError(400, err.response?.data?.message);
    }
    throw createError(500, err.response?.data?.message);
  }
}

export async function validateAddress({ cryptoId, address, extraId }) {
  const item = getCrypto(cryptoId);
  const { data } = await changenow({
    method: 'get',
    url: 'validate/address',
    params: {
      currency: item.changenow.network,
      address,
      extraId,
    },
  });
  return {
    isValid: data?.result || false,
  };
}

export async function createTransaction({ walletId, from, to, amount, address, extraId, refundAddress }) {
  const fromCrypto = getCrypto(from);
  const toCrypto = getCrypto(to);
  const { data } = await changenow({
    method: 'post',
    url: 'exchange',
    data: {
      fromAmount: normalizeNumber(amount, fromCrypto.decimals),
      fromCurrency: fromCrypto.changenow.ticker,
      fromNetwork: fromCrypto.changenow.network,
      toCurrency: toCrypto.changenow.ticker,
      toNetwork: toCrypto.changenow.network,
      address,
      extraId,
      refundAddress,
      flow: 'standard',
      type: 'direct',
      userId: getUserId(walletId, 'ChangeNOW'),
    },
  });
  return {
    id: data.id,
    depositAmount: normalizeNumber(data.fromAmount, fromCrypto.decimals),
    depositAddress: data.payinAddress,
    extraId: data.payinExtraId,
  };
}

export async function getTransaction(id) {
  const { data } = await changenow({
    method: 'get',
    url: 'exchange/by-id',
    params: {
      id,
    },
  });
  const from = getCryptoByChangenow(data.fromNetwork, data.fromCurrency);
  const to = getCryptoByChangenow(data.toNetwork, data.toCurrency);
  return {
    id: data.id,
    trackUrl: `mailto:support@changenow.io?subject=ChangeNOW transaction ${data.id}`,
    status: mapStatus(data.status),
    amountTo: data.amountTo ? normalizeNumber(data.amountTo, to.decimals) : '0',
    amountExpectedTo: data.expectedAmountTo ? normalizeNumber(data.expectedAmountTo, to.decimals) : '0',
    amountFrom: data.amountFrom ? normalizeNumber(data.amountFrom, from.decimals) : '0',
    amountExpectedFrom: data.expectedAmountFrom ? normalizeNumber(data.expectedAmountFrom, from.decimals) : '0',
    cryptoFrom: from._id,
    cryptoTo: to._id,
    createdAt: new Date(data.createdAt).toISOString(),
    payinAddress: data.payinAddress,
    payinHash: data.payinHash || undefined,
    payoutAddress: data.payoutAddress,
    payoutHash: data.payoutHash || undefined,
    refundAddress: data.refundAddress || undefined,
  };
}

export async function getTransactions({ ids }) {
  return Promise.all(ids.map(getTransaction));
}
