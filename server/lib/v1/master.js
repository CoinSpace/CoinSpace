'use strict';

const geo = require('./geo');
const fee = require('./fee');
const ticker = require('./ticker');
const moonpay = require('./moonpay');
const github = require('./github');

function cleanGeo(interval) {
  setInterval(function intervalFunction() {
    geo.removeOlderThan(interval).catch(console.error);
    return intervalFunction;
  }(), interval);
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

function cacheTicker(interval) {
  setInterval(function intervalFunction() {
    ticker.getFromAPI().then((data) => {
      if (global.gc) global.gc();
      return ticker.save(data);
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
  cleanGeo,
  cacheFees,
  cacheTicker,
  cacheMoonpayCurrencies,
  cacheMoonpayCountries,
  cacheGithubReleases,
};
