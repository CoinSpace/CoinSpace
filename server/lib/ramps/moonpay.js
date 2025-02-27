import axios from 'axios';
import crypto from 'crypto';
import { dbMemoize } from '../db.js';

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

async function buy({ countryCode, crypto, address }) {
  const result = await getCountryAndCurrency(countryCode, crypto);
  if (!result) return;
  const { country, currency } = result;
  if (country.isBuyAllowed) {
    const params = new URLSearchParams({
      apiKey: process.env.MOONPAY_API_KEY,
      currencyCode: currency.code,
      walletAddress: address,
      colorCode,
      enableRecurringBuys: true,
    });
    return {
      ...rampData,
      url: signUrl(`https://buy${envSuffix}.moonpay.com?${params}`),
    };
  }
}

async function sell({ countryCode, crypto, address }) {
  const result = await getCountryAndCurrency(countryCode, crypto);
  if (!result) return;
  const { country, currency } = result;
  if (country.isSellAllowed && currency.isSellSupported) {
    const params = new URLSearchParams({
      apiKey: process.env.MOONPAY_API_KEY,
      baseCurrencyCode: currency.code,
      refundWalletAddress: address,
      colorCode,
    });
    return {
      ...rampData,
      url: signUrl(`https://sell${envSuffix}.moonpay.com?${params}`),
    };
  }
}

async function getCountryAndCurrency(countryCode, crypto) {
  if (!crypto?.moonpay) return;
  const countries = await cachedCountries();
  const country = countryCode ? countries.find((item) => item.alpha2 === countryCode) : {
    isBuyAllowed: true,
    isSellAllowed: true,
  };
  if (!country) return;

  const currencies = await cachedCurrencies();
  const currency = currencies.find((item) => item.id === crypto.moonpay.id);
  if (!currency) return;
  if (currency.isSuspended) return;
  if (currency.notAllowedCountries && currency.notAllowedCountries.includes(country.alpha2)) return;
  return { country, currency };
}

const cachedCurrencies = dbMemoize(async () => {
  const { data } = await rampApi.get('/v3/currencies');
  return data;
}, { key: 'moonpay-currencies', ttl: 1 * 60 * 60 }); // 1 hour

const cachedCountries = dbMemoize(async () => {
  const { data } = await rampApi.get('/v3/countries');
  return data;
}, { key: 'moonpay-countries', ttl: 1 * 60 * 60 }); // 1 hour

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
