import * as Sentry from '@sentry/vue';

import { NetworkError } from '@coinspace/cs-common/errors';
import { release } from './version.js';

function getConnectionType() {
  return window.localStorage?.getItem?.('_cs_onion') === 'true' ? 'tor' : 'web';
}

function getUserId() {
  return window.localStorage?.getItem?.('_cs_id') || null;
}

export function setSentryConnection() {
  Sentry.setTag('connection', getConnectionType());
}

export function setSentryUser() {
  Sentry.setUser({ id: getUserId() });
}

export function addSentryVueIntegration(app) {
  Sentry.addIntegration(Sentry.vueIntegration({ app }));
}

Sentry.init({
  debug: import.meta.env.DEV === true,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  transport: Sentry.makeMultiplexedTransport(Sentry.makeFetchTransport, () => {
    if (getConnectionType() === 'tor') {
      return [{ dsn: import.meta.env.VITE_SENTRY_DSN_TOR }];
    }
    return [{ dsn: import.meta.env.VITE_SENTRY_DSN }];
  }),
  initialScope: {
    tags: { connection: getConnectionType() },
    user: { id: getUserId() },
  },
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
  release,
  normalizeDepth: 5,
  integrations: (integrations) => {
    integrations.push(
      Sentry.extraErrorDataIntegration({
        captureErrorCause: true,
      }),
      Sentry.captureConsoleIntegration({
        levels: ['error'],
      }),
      Sentry.thirdPartyErrorFilterIntegration({
        filterKeys: ['coinwallet'],
        behaviour: 'drop-error-if-exclusively-contains-third-party-frames',
      })
    );
    return integrations.filter((integration) => !['BrowserSession', 'Vue'].includes(integration.name));
  },
  beforeSend(event, { originalException: error }) {
    if (error instanceof NetworkError) return null;
    if (error?.name === 'NotAllowedError') return null;
    if (error?.message?.includes('Failed to fetch dynamically imported module')
      || error?.message?.includes('error loading dynamically imported module')
    ) {
      location.reload();
      return null;
    }
    return event;
  },
});
