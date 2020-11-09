'use strict';

const pForever = require('p-forever');
const delay = require('delay');
const fee = require('./v1//fee');
const moonpay = require('./v1//moonpay');
const github = require('./v1//github');
const tokens = require('./tokens');

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
  setInterval(function intervalFunction() {
    fee.getFromAPI('bitcoin').then((data) => {
      if (global.gc) global.gc();
      return fee.save('bitcoin', {
        minimum: data.minimum,
        hour: data.hourFee,
        fastest: data.fastestFee,
      });
    }).catch(console.error);
    return intervalFunction;
  }(), interval);
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
  setInterval(function intervalFunction() {
    github.getLatest().then((updates) => {
      return github.save(Object.values(updates));
    }).catch(console.error);
    return intervalFunction;
  }(), interval);
}

module.exports = {
  syncTokens,
  updatePrices,
  cacheFees,
  cacheMoonpayCurrencies,
  cacheMoonpayCountries,
  cacheGithubReleases,
};
