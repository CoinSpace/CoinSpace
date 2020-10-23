'use strict';

const Sentry = require('@sentry/node');
const Integrations = require('@sentry/integrations');
const db = require('./lib/v1/db');
const tasks = require('./lib/tasks');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT,
  release: `coin.worker@${process.env.npm_package_version}`,
  integrations: [
    new Integrations.CaptureConsole({
      levels: ['error'],
    }),
  ],
});

db().then(async () => {
  await Promise.all([
    tasks.syncTokens(12 * 60 * 60 * 1000), // delay 12 hours
    tasks.updatePrices(60 * 1000), // delay 1 minute
    tasks.cleanGeo(60 * 60 * 1000), // 1 hour
    tasks.cacheFees(10 * 60 * 1000), // 10 minutes
    tasks.cacheMoonpayCurrencies(60 * 60 * 1000), // 1 hour
    tasks.cacheMoonpayCountries(60 * 60 * 1000), // 1 hour
    tasks.cacheGithubReleases(10 * 60 * 1000), // 10 minutes
  ]);
}).catch((error) => {
  console.error('error', error);
});
