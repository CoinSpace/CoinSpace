import ExpiryMap from 'expiry-map';
import axios from 'axios';
import pMemoize from 'p-memoize';

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

async function buy(countryCode, crypto) {
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
  url.searchParams.set('crypto_currencies_list', JSON.stringify([{
    ticker: crypto.guardarian.ticker,
    network: crypto.guardarian.network,
  }]));

  return {
    ...rampData,
    url: url.toString(),
  };
}

async function sell() {}

const cachedCurrencies = pMemoize(async () => {
  const { data } = await rampApi.get('/v1/currencies/crypto');
  return data.filter((item) => item.enabled);
}, { cache: new ExpiryMap(1 * 60 * 60 * 1000) }); // 1 hour

const cachedCountries = pMemoize(async () => {
  const { data } = await rampApi.get('/v1/countries');
  return data;
}, { cache: new ExpiryMap(1 * 60 * 60 * 1000) }); // 1 hour

export default {
  buy,
  sell,
};
