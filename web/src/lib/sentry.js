import * as Sentry from '@sentry/browser';
import { CaptureConsole as CaptureConsoleIntegration } from '@sentry/integrations';

import { NetworkError } from './account/Request.js';
import { release } from './version.js';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  autoSessionTracking: false,
  environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,
  release,
  normalizeDepth: 5,
  integrations: [new CaptureConsoleIntegration({ levels: ['error'] })],
});

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
