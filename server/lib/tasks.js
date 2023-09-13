import cryptos from './cryptos.js';
import delay from 'delay';
import fee from './fee.js';
import github from './github.js';
import moonpay from './v1/moonpay.js';
import pForever from 'p-forever';

async function cryptosSync() {
  console.time('crypto sync');
  await cryptos.sync();
  console.timeEnd('crypto sync');
}

function cryptosUpdatePrices(interval) {
  return pForever(async () => {
    console.time('crypto update prices');
    await cryptos.updatePrices().catch(error('cryptosUpdatePrices'));
    console.timeEnd('crypto update prices');
    await delay(interval);
  });
}

function cryptosUpdateRank(interval) {
  return pForever(async () => {
    console.time('crypto update rank');
    await cryptos.updateRank().catch(error('cryptosUpdateRank'));
    console.timeEnd('crypto update rank');
    await delay(interval);
  });
}

function cacheFees(interval) {
  return pForever(async () => {
    await fee.updateFees().catch(error('cacheFees'));
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
    }).catch(error('cacheMoonpayCurrencies'));
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
    }).catch(error('cacheMoonpayCountries'));
    return intervalFunction;
  }(), interval);
}

function cacheGithubReleases(interval) {
  return pForever(async () => {
    await github.sync().catch(error('cacheGithubReleases'));
    await delay(interval);
  });
}

function error(work) {
  return (e) => {
    e.message = `${work}: ${e.message}`;
    console.error(e);
  };
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
