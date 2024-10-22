import axios from 'axios';
import { dbMemoize } from '../db.js';

const API_KEY = process.env.GUARDARIAN_API_KEY;
const rampData = {
  id: 'guardarian',
  name: 'Guardarian',
  description: 'Licensed gateway',
};
const rampApi = axios.create({
  baseURL: 'https://api-payments.guardarian.com/',
  timeout: 15000, // 15 secs
  headers: { 'x-api-key': API_KEY },
});

async function buy({ countryCode, crypto, address }) {
  return ramp('buy', countryCode, crypto, address);
}

async function sell({ countryCode, crypto }) {
  return ramp('sell', countryCode, crypto);
}

async function ramp(type, countryCode, crypto, address) {
  if (!API_KEY) return;
  if (!crypto) return;
  const countries = await cachedCountries();
  const country = countries.find((item) => item.code_iso_alpha_2 === countryCode && item.supported);
  if (countryCode && !country) return;

  const currencies = await cachedCurrencies();
  let currency;
  if (crypto.guardarian) {
    currency = currencies.find((currency) => {
      if (currency.ticker !== crypto.guardarian.ticker) return;
      const network = currency.networks.find((network) => {
        return network.network === crypto.guardarian.network && network.payment_methods.length;
      });
      return !!network;
    });
  }
  if (!currency) return;

  const url = new URL('https://guardarian.com/calculator/v1/');
  url.searchParams.set('partner_api_token', API_KEY);
  url.searchParams.set('theme', 'blue');
  url.searchParams.set('type', 'narrow');
  url.searchParams.set('default_side', `${type}_crypto`);
  url.searchParams.set('side_toggle_disabled', 'true');
  url.searchParams.set('crypto_currencies_list', JSON.stringify([{
    ticker: crypto.guardarian.ticker,
    network: crypto.guardarian.network,
  }]));

  if (type === 'buy') {
    url.searchParams.set('payout_address', address);
  }

  return {
    ...rampData,
    url: url.toString(),
  };
}

const cachedCurrencies = dbMemoize(async () => {
  const { data } = await rampApi.get('/v1/currencies/crypto');
  return data.filter((item) => item.enabled);
}, { key: 'guardarian-currencies-crypto', ttl: 1 * 60 * 60 }); // 1 hour

const cachedCountries = dbMemoize(async () => {
  const { data } = await rampApi.get('/v1/countries');
  return data;
}, { key: 'guardarian-countries', ttl: 1 * 60 * 60 }); // 1 hour

export default {
  buy,
  sell,
};
