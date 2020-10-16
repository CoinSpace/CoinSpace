'use strict';

const request = require('lib/request');
const { urlRoot } = window;
const LS = require('lib/wallet/localStorage');
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
        url: urlRoot + 'v1/moonpay/coins',
        params: { country: data.alpha3 },
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
    enabledPaymentMethods: 'credit_debit_card,sepa_bank_transfer,gbp_bank_transfer,apple_pay',
  };

  const queryString = Object.keys(params).map((key) => {
    return key + '=' + encodeURIComponent(params[key]);
  }).join('&');

  baseUrl += queryString;
  return baseUrl;
}

function getSellUrl(baseCurrencyCode, refundWalletAddress) {
  let baseUrl = process.env.MOONPAY_WIDGET_SELL_URL + '&';
  const params = {
    baseCurrencyCode,
    refundWalletAddress,
  };
  const queryString = Object.keys(params).map((key) => {
    return key + '=' + encodeURIComponent(params[key]);
  }).join('&');
  baseUrl += queryString;
  return baseUrl;
}

async function signUrls(urls) {
  const result = await request({
    url: `${urlRoot}v2/moonpay/sign?id=${LS.getId()}`,
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
