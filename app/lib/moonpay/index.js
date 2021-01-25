'use strict';

const request = require('lib/request');
const querystring = require('querystring');
const { urlRoot } = window;
const apiKey = process.env.MOONPAY_API_KEY;
let coins = {};
let isBuyAllowed = false;
let isSellAllowed = false;
let isInited = false;

async function init() {
  if (isInited) return true;
  isInited = true;
  try {
    const data = await request({
      url: 'https://api.moonpay.io/v3/ip_address',
      params: { apiKey },
      hideFlashError: true,
    });
    ({ isBuyAllowed } = data);
    ({ isSellAllowed } = data);

    if (isBuyAllowed || isSellAllowed) {
      const _coins = await request({
        url: urlRoot + 'api/v1/moonpay/coins',
        params: { country: data.alpha3 },
        id: true,
      });
      if (_coins) coins = _coins;
    }
  } catch (err) {
    if (err.message !== 'Network Error') console.error(err);
  }
}

async function getWidgetUrls(symbol, address) {
  let buy;
  let sell;
  let urls = [];

  if (isBuySupported(symbol) && address) {
    buy = getBuyUrl(symbol.toLowerCase(), address);
    urls.push(buy);
    buy = urls.length - 1;
  }
  if (isSellSupported(symbol) && address) {
    sell = getSellUrl(symbol.toLowerCase(), address);
    urls.push(sell);
    sell = urls.length - 1;
  }

  if (urls.length) {
    urls = await signUrls(urls);
    buy = urls[buy];
    sell = urls[sell];
  }

  return {
    buy,
    sell,
  };
}

function isBuySupported(symbol) {
  if (!isBuyAllowed) return false;
  return !!Object.keys(coins).find((key) => {
    return coins[key].symbol === symbol && coins[key].isSupported;
  });
}

function isSellSupported(symbol) {
  if (!isSellAllowed) return false;
  return !!Object.keys(coins).find((key) => {
    return coins[key].symbol === symbol && coins[key].isSellSupported;
  });
}

function getBuyUrl(currencyCode, walletAddress) {
  let baseUrl = process.env.MOONPAY_WIDGET_BUY_URL + '&';
  const params = {
    currencyCode,
    walletAddress,
    enabledPaymentMethods: [
      'credit_debit_card',
      'apple_pay',
      'google_pay',
      'samsung_pay',
      'sepa_bank_transfer',
      'gbp_bank_transfer',
      'gbp_open_banking_payment',
    ].join(','),
  };

  baseUrl += querystring.stringify(params);
  return baseUrl;
}

function getSellUrl(baseCurrencyCode, refundWalletAddress) {
  let baseUrl = process.env.MOONPAY_WIDGET_SELL_URL + '&';
  const params = {
    baseCurrencyCode,
    refundWalletAddress,
  };
  baseUrl += querystring.stringify(params);
  return baseUrl;
}

async function signUrls(urls) {
  const result = await request({
    url: `${urlRoot}api/v2/moonpay/sign`,
    method: 'post',
    data: {
      urls,
    },
    seed: 'public',
  });
  return result.urls;
}

module.exports = {
  init,
  getWidgetUrls,
};
