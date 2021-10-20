import request from 'lib/request';

function getPairsParams(fromSymbol, toSymbol) {
  return request({
    url: process.env.SITE_URL + 'api/v1/changelly/getPairsParams',
    params: {
      from: fromSymbol,
      to: toSymbol,
    },
    id: true,
  });
}

function estimate(fromSymbol, toSymbol, amount) {
  return request({
    url: process.env.SITE_URL + 'api/v1/changelly/estimate',
    params: {
      from: fromSymbol,
      to: toSymbol,
      amount,
    },
    id: true,
  });
}

function validateAddress(address, symbol) {
  if (!address) return Promise.resolve(false);
  if (!symbol) return Promise.resolve(false);
  return request({
    url: process.env.SITE_URL + 'api/v1/changelly/validate/' + address + '/' + symbol,
    id: true,
  }).then((data) => {
    return !!data.isValid;
  });
}

function createTransaction(options) {
  return request({
    url: process.env.SITE_URL + 'api/v1/changelly/createTransaction',
    method: 'post',
    data: {
      from: options.fromSymbol,
      to: options.toSymbol,
      amount: options.fromAmount,
      address: options.toAddress,
      refundAddress: options.returnAddress,
    },
    id: true,
  }).then((data) => {
    if (!data) throw new Error('exchange_error');
    return data;
  });
}

function getTransaction(id) {
  return request({
    url: process.env.SITE_URL + 'api/v1/changelly/transaction/' + id,
    id: true,
  });
}

export default {
  getPairsParams,
  estimate,
  validateAddress,
  createTransaction,
  getTransaction,
};
