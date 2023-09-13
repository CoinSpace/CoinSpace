import cryptoDB from '@coinspace/crypto-db';

import btcdirect from './btcdirect.js';
import guardarian from './guardarian.js';
import moonpay from './moonpay.js';
import onramper from './onramper.js';

async function buy({ countryCode, crypto: cryptoId, address }) {
  const crypto = cryptoDB.find((item) => item._id === cryptoId);
  const ramps = [
    moonpay,
    onramper,
    btcdirect,
    guardarian,
  ];
  return (await Promise.all(ramps.map((ramp) => {
    return ramp.buy(countryCode, crypto, address).catch(console.error);
  }))).filter(Boolean);
}

async function sell({ countryCode, crypto: cryptoId, address }) {
  const crypto = cryptoDB.find((item) => item._id === cryptoId);
  const ramps = [
    moonpay,
    onramper,
    btcdirect,
    guardarian,
  ];
  return (await Promise.all(ramps.map((ramp) => {
    return ramp.sell(countryCode, crypto, address).catch(console.error);
  }))).filter(Boolean);
}

export default {
  buy,
  sell,
};
