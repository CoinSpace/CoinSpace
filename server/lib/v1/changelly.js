var axios = require('axios');
var crypto = require('crypto');
var Big = require('big.js');

var URL = 'https://api.changelly.com';
var CHANGELLY_API_SECRET = process.env.CHANGELLY_API_SECRET;
var CHANGELLY_API_KEY = process.env.CHANGELLY_API_KEY;

var PRIORITY_SYMBOLS = ['BTC', 'BCH', 'BSV', 'ETH', 'LTC', 'XRP', 'XLM', 'EOS', 'DOGE', 'DASH'];

function getCoins() {
  return request('getCurrenciesFull', {}).then(function(currencies) {
    var coins = currencies.filter(function(currency) {
      return currency.enabled;
    }).map(function(currency) {
      return {
        name: currency.fullName,
        symbol: encodeSymbol(currency.name)
      }
    }).sort(function(a, b) {
      if (PRIORITY_SYMBOLS.indexOf(a.symbol) === -1 && PRIORITY_SYMBOLS.indexOf(b.symbol) === -1) {
        return (a.symbol > b.symbol) ? 1 : -1
      };
      if (PRIORITY_SYMBOLS.indexOf(b.symbol) === -1) return -1;
      if (PRIORITY_SYMBOLS.indexOf(a.symbol) === -1) return 1;
      if (PRIORITY_SYMBOLS.indexOf(a.symbol) > PRIORITY_SYMBOLS.indexOf(b.symbol)) return 1;
      return -1;
    });
    return coins;
  });
}

function estimate(from, to, amount) {
  from = decodeSymbol(from)
  to = decodeSymbol(to)
  return Promise.all([
    request('getExchangeAmount', [{
      from: from,
      to: to,
      amount: amount
    }]),
    request('getMinAmount', {
      from: from,
      to: to
    })
  ]).then(function(results) {
    var exchangeAmounts = results[0];
    var minAmount = results[1];
    return {
      networkFee: prettyNumber(exchangeAmounts[0].networkFee),
      rate: exchangeAmounts[0].amount === '0' ? '0' : prettyNumber(Big(exchangeAmounts[0].result).div(Big(exchangeAmounts[0].amount))),
      result: prettyNumber(exchangeAmounts[0].result),
      minAmount: prettyNumber(minAmount)
    }
  });
}

function prettyNumber(n) {
  return Big(n).toFixed(8).replace(/0+$/, '').replace(/\.+$/, '')
}

function validateAddress(address, symbol) {
  return request('validateAddress', {
    address: address,
    currency: decodeSymbol(symbol)
  }).then(function(data) {
    return {
      isValid: data ? data.result : false
    }
  });
}

function createTransaction(from, to, amount, address, refundAddress) {
  return request('createTransaction', {
    from: decodeSymbol(from),
    to: decodeSymbol(to),
    amount: amount,
    address: address,
    refundAddress: refundAddress
  }).then(function(data) {
    if (!data) return false;
    return {
      id: data.id,
      depositAmount: data.amountExpectedFrom,
      depositSymbol: encodeSymbol(data.currencyFrom),
      depositAddress: data.payinAddress,
      returnAddress: refundAddress,
      extraId: data.payinExtraId,
      toAddress: data.payoutAddress,
      toSymbol: encodeSymbol(data.currencyTo),
      rate: prettyNumber(Big(data.amountExpectedTo).div(Big(data.amountExpectedFrom)))
    };
  });
}

function getTransaction(id) {
  return request('getTransactions', {
    id: id,
  }).then(function(txs) {
    var tx = txs && txs[0];
    if (!tx) return {error: 'Transaction not found'};
    return {
      amountTo: tx.amountTo,
      status: tx.status
    };
  })
}

function encodeSymbol(symbol) {
  return symbol.toUpperCase();
}

function decodeSymbol(symbol) {
  return symbol.toLowerCase();
}

function request(method, params) {
  var message = {
    jsonrpc: '2.0',
    id: 'cs',
    method: method,
    params: params
  }
  var sign = crypto.createHmac('sha512', CHANGELLY_API_SECRET).update(JSON.stringify(message)).digest('hex');
  return axios({
    method: 'post',
    url: URL,
    headers: {
      'api-key': CHANGELLY_API_KEY,
      'sign': sign
    },
    data: message
  }).then(function(response) {
    return response && response.data && response.data.result;
  });
}

module.exports = {
  getCoins: getCoins,
  estimate: estimate,
  validateAddress: validateAddress,
  createTransaction: createTransaction,
  getTransaction: getTransaction
};
