'use strict';

const request = require('lib/request');

const { urlRoot } = window;

function getCoins() {
  return request({
    url: urlRoot + 'api/v1/changelly/getCoins',
    id: true,
  });
}

function getMinAmount(fromSymbol, toSymbol) {
  return request({
    url: urlRoot + 'api/v1/changelly/getMinAmount',
    params: {
      from: fromSymbol,
      to: toSymbol,
    },
    id: true,
  });
}

function estimate(fromSymbol, toSymbol, amount) {
  return request({
    url: urlRoot + 'api/v1/changelly/estimate',
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
    url: urlRoot + 'api/v1/changelly/validate/' + address + '/' + symbol,
    id: true,
  }).then((data) => {
    return !!data.isValid;
  });
}

function createTransaction(options) {
  return request({
    url: urlRoot + 'api/v1/changelly/createTransaction',
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
    url: urlRoot + 'api/v1/changelly/transaction/' + id,
    id: true,
  });
}

module.exports = {
  getCoins,
  getMinAmount,
  estimate,
  validateAddress,
  createTransaction,
  getTransaction,
};
