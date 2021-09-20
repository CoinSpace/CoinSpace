const cryptoSchemes = [
  { scheme: 'bitcoin', cryptoId: 'bitcoin@bitcoin' },
  { scheme: 'bitcoincash', cryptoId: 'bitcoin-cash@bitcoin-cash' },
  { scheme: 'bitcoinsv', cryptoId: 'bitcoin-sv@bitcoin-sv' },
  { scheme: 'ethereum', cryptoId: 'ethereum@ethereum' },
  { scheme: 'litecoin', cryptoId: 'litecoin@litecoin' },
  { scheme: 'ripple', cryptoId: 'xrp@ripple' },
  { scheme: 'stellar', cryptoId: 'stellar@stellar' },
  { scheme: 'eos', cryptoId: 'eos@eos' },
  { scheme: 'dogecoin', cryptoId: 'dogecoin@dogecoin' },
  { scheme: 'dash', cryptoId: 'dash@dash' },
  { scheme: 'monero', cryptoId: 'monero@monero' },
];

function getSchemeCryptoId(url) {
  if (!url) return false;
  const scheme = url.split(':')[0];
  return cryptoSchemes.find((item) => item.scheme === scheme);
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

function registerProtocolHandler(crypto) {
  if (process.env.BUILD_PLATFORM !== 'web') return;
  if (!navigator.registerProtocolHandler) return;
  const scheme = cryptoSchemes.find((item) => item.cryptoId === crypto._id);
  if (!scheme) return;
  try {
    navigator.registerProtocolHandler(
      scheme,
      `${process.env.SITE_URL}wallet/?crypto=${crypto._id}&bip21=%s`, 'Coin Wallet'
    );
    // eslint-disable-next-line
  } catch (e) {}
}

export default {
  getSchemeCryptoId,
  decode,
  registerProtocolHandler,
};
