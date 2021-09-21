import pForever from 'p-forever';
import delay from 'delay';
import fee from './fee.js';
import moonpay from './v1/moonpay.js';
import github from './github.js';
import tokens from './tokens.js';
import cryptos from './cryptos.js';

function cryptosSync() {
  return cryptos.sync();
}

function cryptosUpdatePrices(interval) {
  return pForever(async () => {
    await cryptos.updatePrices().catch(console.error);
    await delay(interval);
  });
}

function cryptosUpdateRank(interval) {
  return pForever(async () => {
    await cryptos.updateRank().catch(console.error);
    await delay(interval);
  });
}

function syncTokens(interval) {
  return pForever(async () => {
    await tokens.syncTokens().catch(console.error);
    await delay(interval);
  });
}

function updatePrices(interval) {
  return pForever(async () => {
    await tokens.updatePrices().catch(console.error);
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
  syncTokens,
  updatePrices,
  cacheFees,
  cacheMoonpayCurrencies,
  cacheMoonpayCountries,
  cacheGithubReleases,
};
