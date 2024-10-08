import cryptoDB from '@coinspace/crypto-db';

import bitnovo from './bitnovo.js';
import btcdirect from './btcdirect.js';
import guardarian from './guardarian.js';
import moonpay from './moonpay.js';
import onramper from './onramper.js';
import paybis from './paybis.js';

const ramps = [
  moonpay,
  onramper,
  btcdirect,
  guardarian,
  bitnovo,
  paybis,
];

async function buy(walletId, { countryCode, crypto: cryptoId, address }) {
  const crypto = cryptoDB.find((item) => item._id === cryptoId);
  return (await Promise.all(ramps.map((ramp) => {
    return ramp.buy({ walletId, countryCode, crypto, address }).catch(console.error);
  }))).filter(Boolean);
}

async function sell(walletId, { countryCode, crypto: cryptoId, address }) {
  const crypto = cryptoDB.find((item) => item._id === cryptoId);
  return (await Promise.all(ramps.map((ramp) => {
    return ramp.sell({ walletId, countryCode, crypto, address }).catch(console.error);
  }))).filter(Boolean);
}

export default {
  buy,
  sell,
};
