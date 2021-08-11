'use strict';

const axios = require('axios');
const crypto = require('crypto');
const Big = require('big.js');

const URL = 'https://api.changelly.com';
const {
  CHANGELLY_API_SECRET,
  CHANGELLY_API_KEY,
} = process.env;

const PRIORITY_SYMBOLS = ['BTC', 'BCH', 'BSV', 'ETH', 'LTC', 'XRP', 'XLM', 'EOS', 'DOGE', 'DASH', 'XMR', 'USDT'];
const DEPRECATED_SYMBOLS = [
  'wtc',
  'waxp',
  // incorrect networks
  'nrg',
  'arrr',
  'ata',
  'tlm',
];

function getCoins() {
  return request('getCurrenciesFull', {}).then((currencies) => {
    const coins = currencies.filter((currency) => {
      if (DEPRECATED_SYMBOLS.includes(currency.name)) return false;
      return currency.enabled;
    }).map((currency) => {
      return {
        name: encodeName(currency.fullName),
        symbol: encodeSymbol(currency.name),
        network: detectNetwork(currency),
      };
    }).sort((a, b) => {
      if (PRIORITY_SYMBOLS.indexOf(a.symbol) === -1 && PRIORITY_SYMBOLS.indexOf(b.symbol) === -1) {
        return (a.symbol > b.symbol) ? 1 : -1;
      }
      if (PRIORITY_SYMBOLS.indexOf(b.symbol) === -1) return -1;
      if (PRIORITY_SYMBOLS.indexOf(a.symbol) === -1) return 1;
      if (PRIORITY_SYMBOLS.indexOf(a.symbol) > PRIORITY_SYMBOLS.indexOf(b.symbol)) return 1;
      return -1;
    });
    return coins;
  });
}

// deprecated since v3.0.8
function getMinAmount(from, to) {
  from = decodeSymbol(from);
  to = decodeSymbol(to);
  return request('getMinAmount', { from, to }).then((minAmount) => {
    if (!minAmount) throw Error('Exchange is currently unavailable for this pair');
    return {
      minAmount: prettyNumber(minAmount),
    };
  });
}

function getPairsParams(from, to) {
  from = decodeSymbol(from);
  to = decodeSymbol(to);
  return request('getPairsParams', [{ from, to }]).then((result) => {
    if (!result) throw Error('Exchange is currently unavailable for this pair');
    return {
      minAmount: prettyNumber(result[0].minAmountFloat),
      maxAmount: prettyNumber(result[0].maxAmountFloat),
    };
  });
}

function estimate(from, to, amount) {
  from = decodeSymbol(from);
  to = decodeSymbol(to);
  return Promise.all([
    request('getExchangeAmount', [{
      from,
      to,
      amount,
    }]),
    // deprecated (not used since v3.0.7)
    request('getMinAmount', {
      from,
      to,
    }),
  ]).then((results) => {
    const exchangeAmounts = results[0] || [{
      networkFee: '0',
      amount: '0',
      result: '0',
    }];
    const minAmount = results[1];
    return {
      networkFee: prettyNumber(exchangeAmounts[0].networkFee),
      // eslint-disable-next-line max-len
      rate: exchangeAmounts[0].amount === '0' ? '0' : prettyNumber(Big(exchangeAmounts[0].result).div(Big(exchangeAmounts[0].amount))),
      result: prettyNumber(exchangeAmounts[0].result),
      minAmount: prettyNumber(minAmount),
    };
  });
}

function prettyNumber(n) {
  return Big(n).toFixed(8).replace(/0+$/, '').replace(/\.+$/, '');
}

function validateAddress(address, symbol) {
  return request('validateAddress', {
    address,
    currency: decodeSymbol(symbol),
  }).then((data) => {
    return {
      isValid: data ? data.result : false,
    };
  });
}

function createTransaction(from, to, amount, address, refundAddress) {
  return request('createTransaction', {
    from: decodeSymbol(from),
    to: decodeSymbol(to),
    amount,
    address,
    refundAddress,
  }).then((data) => {
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
      rate: prettyNumber(Big(data.amountExpectedTo).div(Big(data.amountExpectedFrom))),
    };
  });
}

function getTransaction(id) {
  return request('getTransactions', {
    id,
  }).then((txs) => {
    const tx = txs && txs[0];
    if (!tx) return { error: 'Transaction not found' };
    return {
      amountTo: tx.amountTo,
      status: tx.status,
      ...(tx.status === 'finished' ? {
        payoutHashLink: tx.payoutHashLink,
        payoutHash: tx.payoutHash,
      } : {}),
    };
  });
}

function encodeSymbol(symbol) {
  if (symbol === 'usdt20') return 'USDT';
  if (symbol === 'usdt') return 'USDT (Omni)';
  return symbol.toUpperCase();
}

function decodeSymbol(symbol) {
  if (symbol === 'USDT (Omni)') return 'usdt';
  if (symbol === 'USDT') return 'usdt20';
  return symbol.toLowerCase();
}

function encodeName(name) {
  if (name === 'Tether ERC20') return 'Tether USD';
  if (name === 'Tether USD') return 'Tether Omni';
  return name;
}

const PREDEFINED_NETWORKS = {
  bch: 'bitcoincash',
  bsv: 'bitcoinsv',
  xrp: 'ripple',
  solo: 'ripple',
  doge: 'dogecoin',
  qtum: 'qtum',
  iost: 'iost',
  ignis: 'ardor',
  eosdt: 'eos',
  bet: 'eos',
  nut: 'eos',
  vet: 'vechainthor',
  tomo: 'tomo',
  hbar: 'hedera',
  asp: 'gasp',
  gasp: 'gasp',
  ckb: 'nervos-ckb',
  ton: 'ton',
  occada: 'cardano',
  tfuel: 'theta',
  icp: 'icp',
  fio: 'fio',
};

const EXPLORERS = {
  'https://etherscan.io/': 'ethereum',
  'https://ethplorer.io/': 'ethereum',
  'https://bscscan.com/': 'binance-smart-chain',
  'https://explorer.binance.org/': 'binance-chain',
  'https://explorer.chiliz.com/': 'chiliz',
  'https://tronscan.org/': 'tron',
  'https://neotracker.io/': 'neo',
  'https://omniexplorer.info/': 'omni-layer',
};

function detectNetwork(item) {
  if (item.addressUrl) {
    for (const explorer in EXPLORERS) {
      if (item.addressUrl.startsWith(explorer)) {
        return EXPLORERS[explorer];
      }
    }
  }
  if (PREDEFINED_NETWORKS[item.name]) {
    return PREDEFINED_NETWORKS[item.name];
  }
  return item.fullName.toLowerCase().replace(/\s/g, '-');
}

function request(method, params) {
  const message = {
    jsonrpc: '2.0',
    id: 'cs',
    method,
    params,
  };
  const sign = crypto.createHmac('sha512', CHANGELLY_API_SECRET).update(JSON.stringify(message)).digest('hex');
  return axios({
    method: 'post',
    url: URL,
    headers: {
      'api-key': CHANGELLY_API_KEY,
      sign,
    },
    data: message,
  }).then((response) => {
    return response && response.data && response.data.result;
  });
}

module.exports = {
  getCoins,
  getMinAmount,
  getPairsParams,
  estimate,
  validateAddress,
  createTransaction,
  getTransaction,
};
