const API_KEY = process.env.ONRAMPER_API_KEY;
const rampData = {
  id: 'onramper',
  name: 'Onramper',
  description: 'Aggregator',
};

async function buy(_, crypto, walletAddress) {
  if (!API_KEY) return;
  if (!crypto?.onramper?.id) return;

  const { id } = crypto.onramper;

  const url = new URL('https://buy.onramper.com/');
  url.searchParams.set('apiKey', API_KEY);
  url.searchParams.set('defaultCrypto', id);
  url.searchParams.set('themeName', 'light');
  url.searchParams.set('onlyCryptos', id);
  url.searchParams.set('wallets', `${id}:${walletAddress}`);
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
