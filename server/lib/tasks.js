import pForever from 'p-forever';
import delay from 'delay';
import fee from './fee.js';
import moonpay from './v1/moonpay.js';
import github from './github.js';
import cryptos from './cryptos.js';

async function cryptosSync() {
  console.time('crypto sync');
  await cryptos.sync();
  console.timeEnd('crypto sync');
}

function cryptosUpdatePrices(interval) {
  return pForever(async () => {
    console.time('crypto update prices');
    await cryptos.updatePrices().catch(console.error);
    console.timeEnd('crypto update prices');
    await delay(interval);
  });
}

function cryptosUpdateRank(interval) {
  return pForever(async () => {
    console.time('crypto update rank');
    await cryptos.updateRank().catch(console.error);
    console.timeEnd('crypto update rank');
    await delay(interval);
  });
}

function cacheFees(interval) {
  return pForever(async () => {
    await fee.updateFees().catch(console.error);
    await delay(interval);
  });
}

function cacheMoonpayCurrencies(interval) {
  setInterval(function intervalFunction() {
    moonpay.getCurrenciesFromAPI().then((data) => {
      if (global.gc) global.gc();
      return Promise.all([
        moonpay.save('coins', data.coins),
        moonpay.save('coins_usa', data.coins_usa),
        moonpay.save('fiat', data.fiat),
      ]);
    }).catch(console.error);
    return intervalFunction;
  }(), interval);
}

function cacheMoonpayCountries(interval) {
  setInterval(function intervalFunction() {
    moonpay.getCountriesFromAPI().then((data) => {
      if (global.gc) global.gc();
      return Promise.all([
        moonpay.save('countries_allowed', data.allowed),
        moonpay.save('countries_document', data.document),
      ]);
    }).catch(console.error);
    return intervalFunction;
  }(), interval);
}

function cacheGithubReleases(interval) {
  return pForever(async () => {
    await github.sync().catch(console.error);
    await delay(interval);
  });
}

export default {
  cryptosSync,
  cryptosUpdatePrices,
  cryptosUpdateRank,
  cacheFees,
  cacheMoonpayCurrencies,
  cacheMoonpayCountries,
  cacheGithubReleases,
};
