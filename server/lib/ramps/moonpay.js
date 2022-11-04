import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';
import axios from 'axios';
import crypto from 'crypto';

const API_KEY = process.env.MOONPAY_API_KEY;
const rampData = {
  name: 'MoonPay',
  svg: 'svg_moonpay',
};
const envSuffix = `${process.env.NODE_ENV === 'production' ? '' : '-sandbox'}`;
const colorCode = '#3cc77a';

async function getRamp(countryCode, crypto, walletAddress) {
  const result = {};
  const countries = await cachedCountries();
  const country = countries.find((item) => item.alpha2 === countryCode);
  if (!country) return {};

  const currencies = await cachedCurrencies();
  let currency;
  if (crypto.moonpay) {
    currency = currencies.find((item) => item.id === crypto.moonpay.id);
  }
  if (!currency) return {};
  if (currency.isSuspended) return {};
  if (country.alpha2 === 'US' && !currency.isSupportedInUS) return {};

  if (country.isBuyAllowed) {
    const params = new URLSearchParams({
      apiKey: process.env.MOONPAY_API_KEY,
      currencyCode: currency.code,
      walletAddress,
      colorCode,
      enableRecurringBuys: true,
    });
    result.buy = {
      ...rampData,
      url: signUrl(`https://buy${envSuffix}.moonpay.com?${params}`),
    };
  }

  if (country.isSellAllowed && currency.isSellSupported) {
    const params = new URLSearchParams({
      apiKey: process.env.MOONPAY_API_KEY,
      baseCurrencyCode: currency.code,
      refundWalletAddress: walletAddress,
      colorCode,
    });
    result.sell = {
      ...rampData,
      url: signUrl(`https://sell${envSuffix}.moonpay.com?${params}`),
    };
  }

  return result;
}

const cachedCurrencies = pMemoize(async () => {
  const result = await axios.get('https://api.moonpay.com/v3/currencies', {
    params: { apiKey: API_KEY },
  });
  return result.data;
}, { cache: new ExpiryMap(1 * 60 * 60 * 1000) }); // 1 hour

const cachedCountries = pMemoize(async () => {
  const result = await axios.get('https://api.moonpay.com/v3/countries', {
    params: { apiKey: API_KEY },
  });
  return result.data;
}, { cache: new ExpiryMap(1 * 60 * 60 * 1000) }); // 1 hour

function signUrl(url) {
  const signature = crypto
    .createHmac('sha256', process.env.MOONPAY_API_SECRET)
    .update(new URL(url).search)
    .digest('base64');
  return `${url}&signature=${encodeURIComponent(signature)}`;
}

export default getRamp;
