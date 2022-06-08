import { Resolution } from '@unstoppabledomains/resolution';
import db from './db.js';
import { promises as dns } from 'dns';

const resolution = new Resolution();
const platformToChain = {
  ethereum: 'ERC20',
  'binance-smart-chain': 'BEP20',
  'avalanche-c-chain': 'ARC20',
  tron: 'TRC20',
};

async function getAddress(domain, cryptoId) {
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
  const crypto = await db.collection('cryptos')
    .findOne({
      _id: cryptoId,
    }, {
      projection: {
        prices: false,
      },
    });
  if (!crypto) return false;
  try {
    let address;
    if (crypto.type === 'coin') {
      address = await resolution.addr(domain, crypto.symbol);
    } else if (crypto.type === 'token') {
      const chain = platformToChain[crypto.platform];
      if (!chain) return false;
      address = await resolution.multiChainAddr(domain, crypto.symbol, chain);
    }
    return address;
  } catch (err) {
    return false;
  }
}

export default {
  getAddress,
};
