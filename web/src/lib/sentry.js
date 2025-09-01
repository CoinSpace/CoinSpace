import * as Sentry from '@sentry/vue';

import { NetworkError } from '@coinspace/cs-common/errors';
import { release } from './version.js';

export function setSentryConnection(isOnion) {
  Sentry.setTag('connection', isOnion ? 'tor' : 'web');
}

export function setSentryUser(id) {
  Sentry.setUser({ id });
}

export function addSentryVueIntegration(app) {
  Sentry.addIntegration(Sentry.vueIntegration({ app }));
}

Sentry.init({
  debug: import.meta.env.DEV === true,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  transport: Sentry.makeMultiplexedTransport(Sentry.makeFetchTransport, () => {
    if (localStorage?.getItem('_cs_onion') === 'true') {
      return [{ dsn: import.meta.env.VITE_SENTRY_DSN_TOR }];
    }
    return [{ dsn: import.meta.env.VITE_SENTRY_DSN }];
  }),
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
    if (error?.message?.includes('Failed to fetch dynamically imported module')) {
      location.reload();
      return null;
    }
    return event;
  },
});

setSentryConnection(localStorage?.getItem('_cs_onion') === 'true');
