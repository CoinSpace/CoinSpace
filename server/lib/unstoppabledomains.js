import { Resolution } from '@unstoppabledomains/resolution';
import db from './db.js';
import createError from 'http-errors';

const resolution = new Resolution();
const platformToChain = {
  ethereum: 'ERC20',
  'binance-smart-chain': 'BEP20',
};

async function resolveTo(domain, cryptoId) {
  const crypto = await db.collection('cryptos')
    .findOne({
      _id: cryptoId,
    }, {
      projection: {
        prices: false,
      },
    });
  if (!crypto) throw createError(404, 'Crypto not found');
  try {
    let address;
    if (crypto.type === 'coin') {
      address = await resolution.addr(domain, crypto.symbol);
    } else if (crypto.type === 'token') {
      const chain = platformToChain[crypto.platform];
      if (!chain) throw new Error('Unsupported platform');
      address = await resolution.multiChainAddr(domain, crypto.symbol, chain);
    }
    return address;
  } catch (err) {
    throw createError(404, 'Address not found');
  }
}

export default {
  resolveTo,
};
