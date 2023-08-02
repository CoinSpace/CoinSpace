import cryptoDB from '@coinspace/crypto-db';
import getMoonpay from './moonpay.js';
import getBtcDirect from './btcdirect.js';
import getOnramper from './onramper.js';
import getGuardarian from './guardarian.js';

async function getRamps(countryCode, cryptoId, address) {
  const crypto = cryptoDB.find((item) => item._id === cryptoId);
  const [moonpay, btcDirect, onramper, guardarian] = await Promise.all([
    getMoonpay(countryCode, crypto, address).catch(console.error),
    getBtcDirect(countryCode, crypto, address).catch(console.error),
    getOnramper(countryCode, crypto, address).catch(console.error),
    getGuardarian(countryCode, crypto, address).catch(console.error),
  ]);

  return {
    buy: [
      btcDirect?.buy,
      onramper?.buy,
      guardarian?.buy,
      moonpay?.buy,
    ].filter(Boolean),
    sell: [
      btcDirect?.sell,
      onramper?.sell,
      moonpay?.sell,
    ].filter(Boolean),
  };
}

export default {
  getRamps,
};
