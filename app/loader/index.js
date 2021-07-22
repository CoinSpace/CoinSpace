import '../application.scss';
import * as Sentry from '@sentry/browser';
import { RewriteFrames } from '@sentry/integrations';
// eslint-disable-next-line no-useless-escape
const SENTRY_PATH_STRIP_RE = /^.*\/[^\.]+(\.app|CodePush|.*(?=\/))/;
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  autoSessionTracking: process.env.BUILD_TYPE === 'electron',
  environment: process.env.SENTRY_ENVIRONMENT,
  release: process.env.RELEASE,
  integrations: [
    new RewriteFrames({
      iteratee(frame) {
        if (frame.filename !== '[native code]' && frame.filename !== '<anonymous>') {
          // eslint-disable-next-line no-useless-escape
          frame.filename = frame.filename.replace(/^file\:\/\//, '').replace(SENTRY_PATH_STRIP_RE, '');
        }
        return frame;
      },
    }),
  ],
});
const { error } = console;
console.error = function() {
  if (typeof arguments[0] === 'string') {
    Sentry.captureException(new Error(arguments[0]));
  } else {
    Sentry.captureException(arguments[0]);
  }
  error.apply(this, arguments);
};

import { fadeOut } from 'lib/transitions/fade.js';
import i18n from 'lib/i18n';

function init() {
  i18n.loadTranslation().then(() => {
    if (window.localStorage && window.Worker) {
      const containerEl = document.getElementById('loader');
      return import(
        /* webpackChunkName: 'application' */
        '../application'
      ).then(() => {
        fadeOut(containerEl, () => {
          window.initCSApp();
        });
      });
    } else {
      nope();
    }
  });
}

function nope() {
  const message = i18n.translate('Sorry, Coin Wallet did not load.') +
  '<br/><br/>' +
  // eslint-disable-next-line max-len
  i18n.translate('Try updating your browser, or switching out of private browsing mode. If all else fails, download Chrome for your device.');
  document.getElementById('loader-message').innerHTML = message;
}

init();
