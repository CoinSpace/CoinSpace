import '../application.scss';
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import * as Sentry from '@sentry/browser';
import { CaptureConsole, RewriteFrames } from '@sentry/integrations';
// eslint-disable-next-line no-useless-escape
const SENTRY_PATH_STRIP_RE = /^.*\/[^\.]+(\.app|CodePush|.*(?=\/))/;
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  autoSessionTracking: process.env.BUILD_TYPE === 'electron',
  environment: process.env.SENTRY_ENVIRONMENT,
  release: process.env.RELEASE,
  integrations: [
    new CaptureConsole({
      levels: ['error'],
    }),
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

import { fadeOut } from 'lib/transitions/fade.js';
import i18n from 'lib/i18n';
if (process.env.BUILD_PLATFORM === 'tor') {
  window.urlRoot = `http://${process.env.DOMAIN_ONION}/`;
} else {
  window.urlRoot = process.env.SITE_URL;
}

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
