const API_KEY = process.env.BITNOVO_API_KEY;
const rampData = {
  id: 'bitnovo',
  name: 'Bitnovo',
  description: 'Get more crypto!',
};

function ramp(type, { crypto, address }) {
  if (!API_KEY) return;
  if (!crypto?.bitnovo?.id) return;

  const { id } = crypto.bitnovo;

  const url = new URL('https://ramp.bitnovo.com/ramp/en');
  url.searchParams.set('apiKey', API_KEY);
  url.searchParams.set('defaultCrypto', id);
  url.searchParams.set('onlyCryptos', id);
  if (type === 'buy') {
    url.searchParams.set('config', 'buy-only');
    url.searchParams.set('wallets', `${id}:${address}`);
  } else {
    url.searchParams.set('config', 'sell-only');
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
