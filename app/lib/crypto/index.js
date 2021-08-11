import _ from 'lodash';
import details from 'lib/wallet/details';

export const walletCoins = [{
  _id: 'bitcoin',
  network: 'bitcoin',
  name: 'Bitcoin',
  txUrl: (txId) => `https://blockchair.com/bitcoin/transaction/${txId}?from=coinwallet`,
}, {
  _id: 'bitcoincash',
  network: 'bitcoincash',
  name: 'Bitcoin Cash',
  txUrl: (txId) => `https://blockchair.com/bitcoin-cash/transaction/${txId}?from=coinwallet`,
}, {
  _id: 'bitcoinsv',
  network: 'bitcoinsv',
  name: 'Bitcoin SV',
  txUrl: (txId) => `https://blockchair.com/bitcoin-sv/transaction/${txId}?from=coinwallet`,
}, {
  _id: 'ethereum',
  network: 'ethereum',
  name: 'Ethereum',
  txUrl: (txId) => `https://blockchair.com/ethereum/transaction/${txId}?from=coinwallet`,
}, {
  _id: 'litecoin',
  network: 'litecoin',
  name: 'Litecoin',
  txUrl: (txId) => `https://blockchair.com/litecoin/transaction/${txId}?from=coinwallet`,
}, {
  _id: 'ripple',
  network: 'ripple',
  name: 'Ripple',
  txUrl: (txId) => `https://xrpcharts.ripple.com/#/transactions/${txId}`,
}, {
  _id: 'stellar',
  network: 'stellar',
  name: 'Stellar',
  txUrl: (txId) => `https://stellar.expert/explorer/public/tx/${txId}`,
}, {
  _id: 'eos',
  network: 'eos',
  name: 'EOS',
  txUrl: (txId) => `https://bloks.io/transaction/${txId}`,
}, {
  _id: 'dogecoin',
  network: 'dogecoin',
  name: 'Dogecoin',
  txUrl: (txId) => `https://blockchair.com/dogecoin/transaction/${txId}?from=coinwallet`,
}, {
  _id: 'dash',
  network: 'dash',
  name: 'Dash',
  txUrl: (txId) => `https://blockchair.com/dash/transaction/${txId}?from=coinwallet`,
}, {
  _id: 'monero',
  network: 'monero',
  name: 'Monero',
  txUrl: (txId) => `https://blockchair.com/monero/transaction/${txId}?from=coinwallet`,
}, {
  _id: 'binancecoin',
  network: 'binance-smart-chain',
  name: 'Binance Smart Chain',
  txUrl: (txId) => `https://bscscan.com/tx/${txId}`,
}];
const DEFAULT_COIN = {
  _id: walletCoins[0]._id,
  network: walletCoins[0].network,
};

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
  setCrypto(DEFAULT_COIN);
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
