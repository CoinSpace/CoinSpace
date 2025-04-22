import crypto from 'node:crypto';

const API_KEY = process.env.ONRAMPER_API_KEY;
const SIGNING_KEY = process.env.ONRAMPER_SIGNING_KEY;
const rampData = {
  id: 'onramper',
  name: 'Onramper',
  description: 'Aggregator',
};

function signUrl(url) {
  if (!SIGNING_KEY) return url;
  const sensitiveParams = new URLSearchParams();
  for (const [key, value] of url.searchParams.entries()) {
    if (['wallets', 'walletAddressTags', 'networkWallets'].includes(key)) {
      sensitiveParams.append(key, value);
    }
  }
  if (sensitiveParams.size === 0) return url;
  // simplified sorting because we use only single key:value param
  // https://docs.onramper.com/docs/signing-widget-url
  sensitiveParams.sort();
  const signature = crypto
    .createHmac('sha256', SIGNING_KEY)
    .update(decodeURIComponent(sensitiveParams.toString()))
    .digest('hex');
  url.searchParams.append('signature', signature);
  return url;
}

function ramp(type, { crypto, address }) {
  if (!API_KEY) return;
  if (!crypto?.onramper?.id) return;

  const id = crypto.onramper.id.toLowerCase();

  const url = new URL('https://buy.onramper.com/');
  url.searchParams.set('mode', type);
  url.searchParams.set('apiKey', API_KEY);
  url.searchParams.set('themeName', 'light');
  if (type === 'buy') {
    url.searchParams.set('defaultCrypto', id);
    url.searchParams.set('onlyCryptos', id);
    url.searchParams.set('wallets', `${id}:${address}`);
  } else {
    url.searchParams.set('sell_defaultCrypto', id);
    url.searchParams.set('sell_onlyCryptos', id);
  }
  return {
    ...rampData,
    url: signUrl(url).toString(),
  };
}

async function buy({ crypto, address }) {
  return ramp('buy', { crypto, address });
}

async function sell({ crypto }) {
  return ramp('sell', { crypto });
}

export default {
  buy,
  sell,
};
