import _ from 'lodash';
import details from 'lib/wallet/details';

export const walletCoins = [{
  _id: 'bitcoin',
  network: 'bitcoin',
  name: 'Bitcoin',
  symbol: 'BTC',
  txUrl: (txId) => `https://blockchair.com/bitcoin/transaction/${txId}?from=coinwallet`,
}, {
  _id: 'bitcoincash',
  network: 'bitcoincash',
  name: 'Bitcoin Cash',
  symbol: 'BCH',
  txUrl: (txId) => `https://blockchair.com/bitcoin-cash/transaction/${txId}?from=coinwallet`,
}, {
  _id: 'bitcoinsv',
  network: 'bitcoinsv',
  name: 'Bitcoin SV',
  symbol: 'BSV',
  txUrl: (txId) => `https://blockchair.com/bitcoin-sv/transaction/${txId}?from=coinwallet`,
}, {
  _id: 'ethereum',
  network: 'ethereum',
  name: 'Ethereum',
  symbol: 'ETH',
  txUrl: (txId) => `https://blockchair.com/ethereum/transaction/${txId}?from=coinwallet`,
}, {
  _id: 'litecoin',
  network: 'litecoin',
  name: 'Litecoin',
  symbol: 'LTC',
  txUrl: (txId) => `https://blockchair.com/litecoin/transaction/${txId}?from=coinwallet`,
}, {
  _id: 'ripple',
  network: 'ripple',
  name: 'Ripple',
  symbol: 'XRP',
  txUrl: (txId) => `https://xrpcharts.ripple.com/#/transactions/${txId}`,
}, {
  _id: 'stellar',
  network: 'stellar',
  name: 'Stellar',
  symbol: 'XLM',
  txUrl: (txId) => `https://stellar.expert/explorer/public/tx/${txId}`,
}, {
  _id: 'eos',
  network: 'eos',
  name: 'EOS',
  symbol: 'EOS',
  txUrl: (txId) => `https://bloks.io/transaction/${txId}`,
}, {
  _id: 'dogecoin',
  network: 'dogecoin',
  name: 'Dogecoin',
  symbol: 'DOGE',
  txUrl: (txId) => `https://blockchair.com/dogecoin/transaction/${txId}?from=coinwallet`,
}, {
  _id: 'dash',
  network: 'dash',
  name: 'Dash',
  symbol: 'DASH',
  txUrl: (txId) => `https://blockchair.com/dash/transaction/${txId}?from=coinwallet`,
}, {
  _id: 'monero',
  network: 'monero',
  name: 'Monero',
  symbol: 'XMR',
  txUrl: (txId) => `https://blockchair.com/monero/transaction/${txId}?from=coinwallet`,
}, {
  _id: 'binancecoin',
  network: 'binance-smart-chain',
  name: 'Binance Smart Chain',
  symbol: 'BNB',
  txUrl: (txId) => `https://bscscan.com/tx/${txId}`,
}];
const DEFAULT_COIN = walletCoins[0];

export function getCrypto() {
  let crypto = window.localStorage.getItem('_cs_token') || DEFAULT_COIN;
  const walletTokens = details.get('tokens');
  try {
    crypto = JSON.parse(crypto);
  // eslint-disable-next-line no-empty
  } catch (e) {}

  if (typeof crypto === 'object') {
    const coin = walletCoins.find((item) => {
      return item._id === crypto._id && item.network === crypto.network;
    });
    if (coin) {
      return coin;
    }
    const token = walletTokens.find((item) => {
      if (item._id) {
        return item._id === crypto._id && item.network === crypto.network;
      } else {
        return _.isEqual(crypto, item);
      }
    });
    if (token) {
      return token;
    }
  }
  setCrypto();
  return DEFAULT_COIN;
}

export function setCrypto(crypto) {
  const item = crypto || DEFAULT_COIN;
  if (item._id) {
    window.localStorage.setItem('_cs_token', JSON.stringify({ _id: item._id, network: item.network }));
  } else {
    window.localStorage.setItem('_cs_token', JSON.stringify(item));
  }
}

export default {
  walletCoins,
  getCrypto,
  setCrypto,
};
