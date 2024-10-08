import axios from 'axios';
import { createHmac } from 'crypto';

const API_KEY = process.env.PAYBIS_API_KEY;
const rampData = {
  id: 'paybis',
  name: 'Paybis',
  description: 'No KYC, low fees',
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

async function buy({ walletId, crypto, address }) {
  if (!API_KEY) return;
  if (!crypto?.paybis?.id) return;

  const partnerUserId = createHmac('sha256', 'Paybis')
    .update(walletId)
    .digest('hex');

  const { data } = await rampApi({
    url: '/v2/request',
    method: 'post',
    data: {
      cryptoWalletAddress: {
        currencyCode: crypto.paybis.id,
        address,
      },
      partnerUserId,
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
