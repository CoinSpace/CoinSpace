const API_KEY = process.env.BITNOVO_API_KEY;
const rampData = {
  id: 'bitnovo',
  name: 'Bitnovo',
  description: 'Bitnovo',
};

async function buy(_, crypto, walletAddress) {
  if (!API_KEY) return;
  if (!crypto?.bitnovo?.id) return;

  const { id } = crypto.bitnovo;

  const url = new URL('https://ramp.bitnovo.com/');
  url.searchParams.set('apiKey', API_KEY);
  url.searchParams.set('defaultCrypto', id);
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
