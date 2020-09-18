'use strict';

const request = require('lib/request');

const { urlRoot } = window;

function getCoins() {
  return request({
    url: urlRoot + 'v1/changelly/getCoins',
  });
}

function estimate(fromSymbol, toSymbol, amount) {
  return request({
    url: urlRoot + 'v1/changelly/estimate',
    params: {
      from: fromSymbol,
      to: toSymbol,
      amount,
    },
  });
}

function validateAddress(address, symbol) {
  if (!address) return Promise.resolve(false);
  if (!symbol) return Promise.resolve(false);
  return request({
    url: urlRoot + 'v1/changelly/validate/' + address + '/' + symbol,
  }).then((data) => {
    return !!data.isValid;
  });
}

function createTransaction(options) {
  return request({
    url: urlRoot + 'v1/changelly/createTransaction',
    method: 'post',
    data: {
      from: options.fromSymbol,
      to: options.toSymbol,
      amount: options.fromAmount,
      address: options.toAddress,
      refundAddress: options.returnAddress,
    },
  }).then((data) => {
    if (!data) throw new Error('exchange_error');
    return data;
  });
}

function getTransaction(id) {
  return request({
    url: urlRoot + 'v1/changelly/transaction/' + id,
  });
}

module.exports = {
  getCoins,
  estimate,
  validateAddress,
  createTransaction,
  getTransaction,
};
