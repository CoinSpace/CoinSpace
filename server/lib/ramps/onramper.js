import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';
import axios from 'axios';

const API_KEY = process.env.ONRAMPER_API_KEY;
const rampData = {
  name: 'Onramper',
  svg: 'svg_onramper',
};
const rampApi = axios.create({
  baseURL: 'https://onramper.tech/',
  timeout: 15000, // 15 secs
  headers: { Authorization: `Basic ${API_KEY}` },
});

async function getRamp(countryCode, crypto, walletAddress) {
  const currencies = await cachedCurrencies(countryCode);

  let currency;
  if (crypto.onramper) {
    currency = currencies.find((item) => item.id === crypto.onramper.id);
  }
  if (!currency) return {};

  const url = new URL('https://widget.onramper.com/');
  url.searchParams.set('apiKey', API_KEY);
  url.searchParams.set('defaultCrypto', currency.id);
  url.searchParams.set('defaultFiat', 'USD');
  url.searchParams.set('supportSwap', false);
  url.searchParams.set('supportSell', false);
  url.searchParams.set('country', countryCode);
  url.searchParams.set('defaultAmount', 300);
  url.searchParams.set('onlyCryptos', currency.id);
  url.searchParams.set('wallets', `${currency.id}:${walletAddress}`);
  return {
    buy: {
      ...rampData,
      url: url.toString(),
    },
  };
}

const cachedCurrencies = pMemoize(async (country = 'all') => {
  const { data } = await rampApi.get('/gateways', {
    params: { country },
  });
  const { gateways } = data;
  return gateways.map((gateway) => {
    return gateway.cryptoCurrencies;
  }).flat();
}, { cache: new ExpiryMap(1 * 60 * 60 * 1000) }); // 1 hour

export default getRamp;
