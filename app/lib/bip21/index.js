const supportedProtocols = [
  'bitcoin',
  'bitcoincash',
  'bitcoinsv',
  'ethereum',
  'litecoin',
  'ripple',
  'stellar',
  'eos',
  'dogecoin',
  'dash',
  'monero',
];

function isValidScheme(url) {
  if (!url) return false;
  return supportedProtocols.some((network) => url.startsWith(`${network}:`));
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

function registerProtocolHandler(network) {
  if (process.env.BUILD_PLATFORM !== 'web') return;
  if (!navigator.registerProtocolHandler) return;
  if (!supportedProtocols.includes(network)) return;
  try {
    navigator.registerProtocolHandler(
      network,
      `${process.env.SITE_URL}wallet/?coin=${network}&bip21=%s`, 'Coin Wallet'
    );
    // eslint-disable-next-line
  } catch (e) {}
}

export default {
  isValidScheme,
  decode,
  registerProtocolHandler,
};
