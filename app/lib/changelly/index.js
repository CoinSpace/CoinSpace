import request from 'lib/request';

function getPairsParams(from, to) {
  return request({
    baseURL: process.env.SITE_URL,
    url: 'api/v3/exchange/changelly/params',
    params: {
      from,
      to,
    },
    seed: 'public',
  });
}

function estimate(from, to, amount) {
  return request({
    baseURL: process.env.SITE_URL,
    url: 'api/v3/exchange/changelly/estimate',
    params: {
      from,
      to,
      amount,
    },
    seed: 'public',
  });
}

function validateAddress(address, crypto) {
  if (!address) return Promise.resolve(false);
  if (!crypto) return Promise.resolve(false);
  return request({
    baseURL: process.env.SITE_URL,
    url: 'api/v3/exchange/changelly/validate/',
    params: {
      address,
      crypto,
    },
    seed: 'public',
  }).then((data) => {
    return !!data.isValid;
  });
}

function createTransaction(options) {
  return request({
    baseURL: process.env.SITE_URL,
    url: 'api/v3/exchange/changelly/transaction',
    method: 'post',
    data: {
      from: options.fromCrypto._id,
      to: options.toCrypto._id,
      amount: options.fromAmount,
      address: options.toAddress,
      refundAddress: options.refundAddress,
    },
    seed: 'public',
  }).then((data) => {
    if (!data) throw new Error('exchange_error');
    return data;
  });
}

function getTransaction(id) {
  return request({
    baseURL: process.env.SITE_URL,
    url: `api/v3/exchange/changelly/transaction/${id}`,
    seed: 'public',
  });
}

export default {
  getPairsParams,
  estimate,
  validateAddress,
  createTransaction,
  getTransaction,
};
