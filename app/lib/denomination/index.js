'use strict';

const symbols = {
  bitcoin: 'BTC',
  bitcoincash: 'BCH',
  bitcoinsv: 'BSV',
  litecoin: 'LTC',
  ethereum: 'ETH',
  ripple: 'XRP',
  stellar: 'XLM',
  eos: 'EOS',
  dogecoin: 'DOGE',
  dash: 'DASH',
};

function getDenomination(token) {
  if (typeof token === 'string') return symbols[token];
  return token.symbol;
}

module.exports = getDenomination;
