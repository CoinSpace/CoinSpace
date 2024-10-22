import axios from 'axios';
import { dbMemoize } from '../db.js';

const API_KEY = process.env.BTCDIRECT_API_KEY;
const rampData = {
  id: 'btcdirect',
  name: 'BTC Direct',
  description: 'Most payment options',
};
const rampApi = axios.create({
  baseURL: `https://api${process.env.NODE_ENV === 'production' ? '' : '-sandbox'}.btcdirect.eu/`,
  timeout: 15000, // 15 secs
  headers: { 'x-api-key': API_KEY },
});

async function buy({ countryCode, crypto, address }) {
  if (!API_KEY) return;
  if (!crypto) return;
  const countries = await cachedCountries();
  const country = countries.find((item) => item.code === countryCode);
  if (countryCode && !country) return;

  const currencies = await cachedCurrencies();

  let currency;
  if (crypto.btcdirect) {
    currency = currencies.find((item) => crypto.btcdirect.currencyPair.includes(item.currencyPair));
  }
  if (!currency) return;

  if (currency.buy && currency.buy.status === 'enabled') {
    const url = new URL('/api/v3/btcdirect/buy', process.env.SITE_URL);
    url.searchParams.set('address', address);
    url.searchParams.set('baseCurrency', currency.baseCurrency.code);
    return {
      ...rampData,
      url: url.toString(),
    };
  }
  return;
}

async function sell() {}

const cachedCurrencies = dbMemoize(async () => {
  const { data } = await rampApi.get('/api/v1/system/currency-pairs');
  return data;
}, { key: 'btcdirect-currency-pairs', ttl: 1 * 60 * 60 }); // 1 hour

const cachedCountries = dbMemoize(async () => {
  const { data } = await rampApi.get('/api/v1/system/info');
  return data.nationalities;
}, { key: 'btcdirect-info', ttl: 1 * 60 * 60 }); // 1 hour

export default {
  buy,
  sell,
};
