import * as Sentry from '@sentry/browser';
import { CaptureConsole as CaptureConsoleIntegration } from '@sentry/integrations';

import { NetworkError } from './account/Request.js';
import { release } from './version.js';

Sentry.addGlobalEventProcessor((event, { originalException: error }) => {
  if (error instanceof NetworkError) return null;
  if (error?.name === 'NotAllowedError') return null;
  if (error?.message?.includes('Failed to fetch dynamically imported module')) {
    location.reload();
    return null;
  }
  event.contexts = { error };
  return event;
});

export async function init() {
  await Sentry.close().catch(console.error);

  const dsn = localStorage?.getItem('_cs_onion') === 'true'
    ? import.meta.env.VITE_SENTRY_DSN_TOR
    : import.meta.env.VITE_SENTRY_DSN;
  Sentry.init({
    dsn,
    autoSessionTracking: false,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
    release,
    normalizeDepth: 5,
    integrations: [new CaptureConsoleIntegration({ levels: ['error'] })],
  });
}

init();
