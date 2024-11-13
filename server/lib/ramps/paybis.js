import axios from 'axios';
import { getUserId } from '../utils.js';

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

async function ramp(type, { walletId, crypto, address }) {
  if (!API_KEY) return;
  if (!crypto?.paybis?.id) return;

  const params = {
    partnerUserId: getUserId(walletId, 'Paybis'),
    locale: 'en',
  };

  if (type === 'buy') {
    params.flow = 'buyCrypto';
    params.cryptoWalletAddress = {
      currencyCode: crypto.paybis.id,
      address,
    };
  } else {
    params.flow = 'sellCrypto';
  }

  const { data } = await rampApi({
    url: '/v2/request',
    method: 'post',
    data: params,
  });

  const url = new URL(widgetURL);
  url.searchParams.set('requestId', data.requestId);
  return {
    ...rampData,
    url: url.toString(),
  };
}

async function buy({ walletId, crypto, address }) {
  return ramp('buy', { walletId, crypto, address });
}

async function sell({ walletId, crypto }) {
  return ramp('sell', { walletId, crypto });
}

export default {
  buy,
  sell,
};
