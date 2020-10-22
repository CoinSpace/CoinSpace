'use strict';

const Sentry = require('@sentry/node');
const Integrations = require('@sentry/integrations');
const pForever = require('p-forever');
const delay = require('delay');
const db = require('./lib/v1/db');
const ethereumTokens = require('./lib/ethereumTokens');

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
    pForever(async () => {
      await ethereumTokens.syncTokens();
      // delay 12 hours
      await delay(12 * 60 * 60 * 1000);
    }),
    pForever(async () => {
      await ethereumTokens.updatePrices();
      // delay 1 minute
      await delay(60 * 1000);
    }),
  ]);
}).catch((error) => {
  console.error('error', error);
});
