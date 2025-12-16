import Integrations from '@sentry/integrations';
import Sentry from '@sentry/node';
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
  tasks.cacheFees(5 * 60 * 1000), // 5 minutes
  tasks.cacheGithubReleases(10 * 60 * 1000), // 10 minutes
]).catch((error) => {
  console.error('error', error);
});
