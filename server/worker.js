import Sentry from '@sentry/node';
import Integrations from '@sentry/integrations';
import tasks from './lib/tasks.js';

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

await Promise.all([
  tasks.syncTokens(12 * 60 * 60 * 1000), // delay 12 hours
  tasks.updatePrices(60 * 1000), // delay 1 minute
  tasks.cacheFees(5 * 60 * 1000), // 5 minutes
  tasks.cacheMoonpayCurrencies(60 * 60 * 1000), // 1 hour
  tasks.cacheMoonpayCountries(60 * 60 * 1000), // 1 hour
  tasks.cacheGithubReleases(10 * 60 * 1000), // 10 minutes
]).catch((error) => {
  console.error('error', error);
});
