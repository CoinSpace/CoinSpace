'use strict';

function isValidScheme(url) {
  if (!url) return false;
  return [
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
  ].some((network) => url.startsWith(`${network}:`));
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

module.exports = {
  isValidScheme,
  decode,
};
