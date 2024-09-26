import { Resolution } from '@unstoppabledomains/resolution';
import cryptoDB from '@coinspace/crypto-db';
import { promises as dns } from 'dns';

const resolution = new Resolution({
  apiKey: process.env.UNSTOPPABLE_DOMAINS_API_KEY,
  sourceConfig: {
    zns: {
      url: 'https://api.zilliqa.com',
      network: 'mainnet',
    },
  },
});

// https://github.com/unstoppabledomains/uns/blob/38ead47f53601ab9e62a289f55e97e9deb0d0605/scripts/blockchain_families.csv
const platformToNetwork = {
  'binance-smart-chain': 'BSC',
  eos: 'EOSIO',
  polygon: 'MATIC',
};
const symbolToSymbol = {
  POL: 'MATIC',
};

async function getAddress(domain, cryptoId) {
  domain = (domain || '').toLowerCase();
  const resolvers = [openalias, unstoppabledomains];
  for (const resolver of resolvers) {
    const address = await resolver(domain, cryptoId);
    if (address) return address;
  }
}

async function openalias(domain, cryptoId) {
  if (cryptoId !== 'bitcoin@bitcoin') return false;
  const prefix = 'btc';
  try {
    const addresses = await dns.resolveTxt(domain);
    for (let i = 0; i < addresses.length; i++) {
      const data = addresses[i][0];

      if (!data.match('^oa1:' + prefix)) continue;

      const match = data.match('recipient_address=([A-Za-z0-9]+)');
      if (!match) continue;
      const address = match[1];
      return address;
    }
  } catch (err) {
    return false;
  }
}

async function unstoppabledomains(domain, cryptoId) {
  const crypto = cryptoDB.find((item) => item._id === cryptoId);
  if (!crypto) return false;
  try {
    if (domain.endsWith('.eth')) {
      return await resolution.addr(domain, 'ETH');
    }
    const symbol = symbolToSymbol[crypto.symbol] || crypto.symbol;
    const platform = cryptoDB.find((item) => item.platform === crypto.platform && item.type === 'coin');
    const network = platformToNetwork[crypto.platform] || platform.symbol;
    return await resolution.getAddress(domain, network, symbol);
  } catch (err) {
    return false;
  }
}

export default {
  getAddress,
};
