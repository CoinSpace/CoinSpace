import axios from 'axios';
import { randomBytes } from 'crypto';

const API_KEY = process.env.PAYBIS_API_KEY;
const rampData = {
  id: 'paybis',
  name: 'Paybis',
  description: 'Paybis',
};

const baseURL = process.env.NODE_ENV === 'production'
  ? 'https://widget-api.paybis.com/'
  : 'https://widget-api.sandbox.paybis.com/';
const widgetURL = process.env.NODE_ENV === 'production'
  ? 'https://widget.paybis.com/'
  : 'https://widget.sandbox.paybis.com/';

const rampApi = axios.create({
  baseURL,
  timeout: 15000, // 15 secs
  headers: {
    Authorization: `Bearer ${API_KEY}`,
  },
});

async function buy(_, crypto, walletAddress) {
  if (!API_KEY) return;
  if (!crypto?.paybis?.id) return;

  const { data } = await rampApi({
    url: '/v2/request',
    method: 'post',
    data: {
      cryptoWalletAddress: {
        currencyCode: crypto.paybis.id,
        address: walletAddress,
      },
      partnerUserId: randomBytes(32).toString('hex'),
      flow: 'buyCrypto',
      locale: 'en',
    },
  });

  const url = new URL(widgetURL);
  url.searchParams.set('requestId', data.requestId);
  return {
    ...rampData,
    url: url.toString(),
  };
}

async function sell() {}

export default {
  buy,
  sell,
};
