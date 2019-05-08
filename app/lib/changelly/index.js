'use strict';

var request = require('lib/request');
var getId = require('lib/wallet').getId;

var urlRoot = window.urlRoot;

function getCoins() {
  return request({
    url: urlRoot + 'changelly/getCoins'
  });
}

function estimate(fromSymbol, toSymbol, amount) {
  return request({
    url: urlRoot + 'changelly/estimate',
    params: {
      from: fromSymbol,
      to: toSymbol,
      amount: amount
    }
  });
}

function validateAddress(address, symbol) {
  if (!address) return Promise.resolve(false);
  if (!symbol) return Promise.resolve(false);
  return request({
    url: urlRoot + 'changelly/validate/' + address + '/' + symbol,
  }).then(function(data) {
    return !!data.isValid;
  });
}

function createTransaction(options) {
  return request({
    url: urlRoot + 'changelly/createTransaction',
    method: 'post',
    data: {
      id: getId(),
      from: options.fromSymbol,
      to: options.toSymbol,
      amount: options.fromAmount,
      address: options.toAddress,
      refundAddress: options.returnAddress,
    }
  }).then(function(data) {
    if (!data) throw new Error('exchange_error');
    return data;
  });
}

function getTransaction(id) {
  return request({
    url: urlRoot + 'changelly/transaction/' + id,
  });
}

module.exports = {
  getCoins: getCoins,
  estimate: estimate,
  validateAddress: validateAddress,
  createTransaction: createTransaction,
  getTransaction: getTransaction
};
