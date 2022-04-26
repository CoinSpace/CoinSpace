import request from 'lib/request';
import querystring from 'querystring';
const apiKey = process.env.MOONPAY_API_KEY;
let coins = {};
let isBuyAllowed = false;
let isSellAllowed = false;
let isInited = false;
const envSuffix = `${process.env.NODE_ENV === 'production' ? '' : '-sandbox'}`;
const MOONPAY_WIDGET_BUY_URL = `https://buy${envSuffix}.moonpay.com?apiKey=${apiKey}`;
const MOONPAY_WIDGET_SELL_URL = `https://sell${envSuffix}.moonpay.com?apiKey=${apiKey}`;

async function init() {
  if (isInited) return true;
  isInited = true;
  try {
    const data = await request({
      url: 'https://api.moonpay.com/v4/ip_address',
      params: { apiKey },
      hideFlashError: true,
    });
    ({ isBuyAllowed } = data);
    ({ isSellAllowed } = data);

    if (isBuyAllowed || isSellAllowed) {
      const _coins = await request({
        url: `${process.env.SITE_URL}api/v1/moonpay/coins`,
        params: { country: data.alpha3 },
        id: true,
      });
      if (_coins) coins = _coins;
    }
  } catch (err) {
    if (err.message !== 'Network Error') console.error(err);
  }
}

async function getWidgetUrls(crypto, address) {
  let buy;
  let sell;
  let urls = [];
  const coin = getMoonpayCoin(crypto);

  if (isBuyAllowed && coin && coin.isSupported && address) {
    buy = getBuyUrl(coin.code, address);
    urls.push(buy);
    buy = urls.length - 1;
  }
  if (isSellAllowed && coin && coin.isSellSupported && address) {
    sell = getSellUrl(coin.code, address);
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

function getMoonpayCoin(crypto) {
  if (crypto.moonpay) {
    return coins[crypto.moonpay.id];
  }
}

function getBuyUrl(currencyCode, walletAddress) {
  let baseUrl = MOONPAY_WIDGET_BUY_URL + '&';
  const params = {
    currencyCode,
    walletAddress,
    enableRecurringBuys: true,
  };

  baseUrl += querystring.stringify(params);
  return baseUrl;
}

function getSellUrl(baseCurrencyCode, refundWalletAddress) {
  let baseUrl = MOONPAY_WIDGET_SELL_URL + '&';
  const params = {
    baseCurrencyCode,
    refundWalletAddress,
  };
  baseUrl += querystring.stringify(params);
  return baseUrl;
}

async function signUrls(urls) {
  const result = await request({
    url: `${process.env.SITE_URL}api/v3/moonpay/sign`,
    method: 'post',
    data: {
      urls,
    },
    seed: 'public',
  });
  return result.urls;
}

export default {
  init,
  getWidgetUrls,
};
