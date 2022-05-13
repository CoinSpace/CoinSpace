import request from 'lib/request';
import querystring from 'querystring';
const apiKey = process.env.MOONPAY_API_KEY;
const supported = [];
let isInited = false;
const envSuffix = `${process.env.NODE_ENV === 'production' ? '' : '-sandbox'}`;
const MOONPAY_WIDGET_BUY_URL = `https://buy${envSuffix}.moonpay.com?apiKey=${apiKey}`;
const MOONPAY_WIDGET_SELL_URL = `https://sell${envSuffix}.moonpay.com?apiKey=${apiKey}`;

async function init() {
  if (isInited) return true;
  isInited = true;
  try {
    const ip = await request({
      url: 'https://api.moonpay.com/v4/ip_address',
      params: { apiKey },
      hideFlashError: true,
    });

    if (ip.isBuyAllowed || ip.isSellAllowed) {
      const currencies = await request({
        url: 'https://api.moonpay.com/v3/currencies',
        params: { apiKey },
        hideFlashError: true,
      });

      supported.push(...currencies
        .filter((currency) => {
          if (currency.type !== 'crypto') {
            return false;
          }
          if (currency.isSuspended) {
            return false;
          }
          if (ip.alpha3 === 'USA') {
            if (currency.isSupportedInUS === false) {
              return false;
            }
            if (currency.notAllowedUSStates && currency.notAllowedUSStates.includes(ip.state)) {
              return false;
            }
          }
          return true;
        })
        .map((currency) => {
          return {
            ...currency,
            isBuySupported: ip.isBuyAllowed,
            isSellSupported: ip.isSellAllowed && currency.isSellSupported,
          };
        })
      );
    }
  } catch (err) {
    if (err.message !== 'Network Error') {
      console.error(err);
    }
  }
}

async function getWidgetUrls(crypto, address) {
  const coin = getMoonpayCoin(crypto);

  if (!coin) {
    return {};
  }

  if (coin.isBuySupported && coin.isSellSupported) {
    const [buy, sell] = await signUrls([
      getBuyUrl(coin.code, address),
      getSellUrl(coin.code, address),
    ]);
    return {
      buy,
      sell,
    };
  } else if (coin.isBuySupported) {
    const [buy] = await signUrls([
      getBuyUrl(coin.code, address),
    ]);
    return {
      buy,
    };
  } else if (coin.isSellSupported) {
    const [sell] = await signUrls([
      getSellUrl(coin.code, address),
    ]);
    return {
      sell,
    };
  }
  return {};
}

function getMoonpayCoin(crypto) {
  if (crypto.moonpay) {
    return supported.find((item) => item.id === crypto.moonpay.id);
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
