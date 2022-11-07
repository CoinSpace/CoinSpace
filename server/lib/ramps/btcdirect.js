import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';
import axios from 'axios';

const API_KEY = process.env.BTCDIRECT_API_KEY;
const rampData = {
  name: 'BTC Direct',
  svg: 'svg_btcdirect',
};
const rampApi = axios.create({
  baseURL: `https://api${process.env.NODE_ENV === 'production' ? '' : '-sandbox'}.btcdirect.eu/`,
  timeout: 15000, // 15 secs
  headers: { 'x-api-key': API_KEY },
});

async function getRamp(countryCode, crypto, walletAddress) {
  const countries = await cachedCountries();
  const country = countries.find((item) => item.code === countryCode);
  if (!country) return {};

  const currencies = await cachedCurrencies();

  let currency;
  if (crypto.btcdirect) {
    currency = currencies.find((item) => crypto.btcdirect.currencyPair.includes(item.currencyPair));
  }
  if (!currency) return {};

  if (currency.buy && currency.buy.status === 'enabled') {
    const url = new URL('/api/v3/btcdirect/buy', process.env.SITE_URL);
    url.searchParams.set('address', walletAddress);
    url.searchParams.set('baseCurrency', currency.baseCurrency.code);
    return {
      buy: {
        ...rampData,
        url: url.toString(),
      },
    };
  }
  return {};
}

const cachedCurrencies = pMemoize(async () => {
  const { data } = await rampApi.get('/api/v1/system/currency-pairs');
  return data;

}, { cache: new ExpiryMap(1 * 60 * 60 * 1000) }); // 1 hour

const cachedCountries = pMemoize(async () => {
  const { data } = await rampApi.get('/api/v1/system/info');
  return data.nationalities;
}, { cache: new ExpiryMap(1 * 60 * 60 * 1000) }); // 1 hour

export default getRamp;
