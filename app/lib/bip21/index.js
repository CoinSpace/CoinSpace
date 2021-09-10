const platformSchemes = {
  bitcoin: 'bitcoin',
  'bitcoin-cash': 'bitcoincash',
  'bitcoin-sv': 'bitcoinsv',
  ethereum: 'ethereum',
  litecoin: 'litecoin',
  ripple: 'ripple',
  stellar: 'stellar',
  eos: 'eos',
  dogecoin: 'dogecoin',
  dash: 'dash',
  monero: 'monero',
};

function isValidScheme(url) {
  if (!url) return false;
  return Object.values(platformSchemes).some((scheme) => url.startsWith(`${scheme}:`));
}

function decode(url) {
  url = url || '';
  const address = url.split('?')[0].split(':').pop();
  const data = { address };
  let match;
  match = url.match(/amount=([0-9.]+)/);
  if (match && match[1]) {
    data.value = match[1];
  }
  match = url.match(/dt=(\d+)/);
  if (match && match[1]) {
    data.tag = match[1];
  }
  return data;
}

function registerProtocolHandler(platform) {
  if (process.env.BUILD_PLATFORM !== 'web') return;
  if (!navigator.registerProtocolHandler) return;
  if (!platformSchemes[platform]) return;
  try {
    navigator.registerProtocolHandler(
      platformSchemes[platform],
      `${process.env.SITE_URL}wallet/?coin=${platformSchemes[platform]}&bip21=%s`, 'Coin Wallet'
    );
    // eslint-disable-next-line
  } catch (e) {}
}

export default {
  isValidScheme,
  decode,
  registerProtocolHandler,
};
