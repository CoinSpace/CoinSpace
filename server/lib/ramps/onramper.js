const API_KEY = process.env.ONRAMPER_API_KEY;
const rampData = {
  id: 'onramper',
  name: 'Onramper',
  description: 'Aggregator',
};

function ramp(type, { crypto, address }) {
  if (!API_KEY) return;
  if (!crypto?.onramper?.id) return;

  const { id } = crypto.onramper;

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
    url: url.toString(),
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
