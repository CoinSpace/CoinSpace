import ExpiryMap from 'expiry-map';
import axios from 'axios';
import crypto from 'crypto';
import pMemoize from 'p-memoize';

const rampData = {
  id: 'moonpay',
  name: 'MoonPay',
  description: 'Fast and simple',
};
const envSuffix = `${process.env.NODE_ENV === 'production' ? '' : '-sandbox'}`;
const rampApi = axios.create({
  baseURL: 'https://api.moonpay.com/',
  timeout: 15000, // 15 secs
});
const colorCode = '#3cc77a';

async function buy(countryCode, crypto, walletAddress) {
  const result = await getCountryAndCurrency(countryCode, crypto);
  if (!result) return;
  const { country, currency } = result;
  if (country.isBuyAllowed) {
    const params = new URLSearchParams({
      apiKey: process.env.MOONPAY_API_KEY,
      currencyCode: currency.code,
      walletAddress,
      colorCode,
      enableRecurringBuys: true,
    });
    return {
      ...rampData,
      url: signUrl(`https://buy${envSuffix}.moonpay.com?${params}`),
    };
  }
}

async function sell(countryCode, crypto, walletAddress) {
  const result = await getCountryAndCurrency(countryCode, crypto);
  if (!result) return;
  const { country, currency } = result;
  if (country.isSellAllowed && currency.isSellSupported) {
    const params = new URLSearchParams({
      apiKey: process.env.MOONPAY_API_KEY,
      baseCurrencyCode: currency.code,
      refundWalletAddress: walletAddress,
      colorCode,
    });
    return {
      ...rampData,
      url: signUrl(`https://sell${envSuffix}.moonpay.com?${params}`),
    };
  }
}

async function getCountryAndCurrency(countryCode, crypto) {
  if (!crypto) return;
  const countries = await cachedCountries();
  const country = countryCode ? countries.find((item) => item.alpha2 === countryCode) : {
    isBuyAllowed: true,
    isSellAllowed: true,
  };
  if (!country) return;

  const currencies = await cachedCurrencies();
  let currency;
  if (crypto.moonpay) {
    currency = currencies.find((item) => item.id === crypto.moonpay.id);
  }
  if (!currency) return;
  if (currency.isSuspended) return;
  if (country.alpha2 === 'US' && !currency.isSupportedInUS) return;
  return { country, currency };
}

const cachedCurrencies = pMemoize(async () => {
  const { data } = await rampApi.get('/v3/currencies');
  return data;
}, { cache: new ExpiryMap(1 * 60 * 60 * 1000) }); // 1 hour

const cachedCountries = pMemoize(async () => {
  const { data } = await rampApi.get('/v3/countries');
  return data;
}, { cache: new ExpiryMap(1 * 60 * 60 * 1000) }); // 1 hour

function signUrl(url) {
  const signature = crypto
    .createHmac('sha256', process.env.MOONPAY_API_SECRET)
    .update(new URL(url).search)
    .digest('base64');
  return `${url}&signature=${encodeURIComponent(signature)}`;
}

export default {
  buy,
  sell,
};
