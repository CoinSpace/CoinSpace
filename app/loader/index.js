'use strict';

require('../application.scss');

const Sentry = require('@sentry/browser');
const Integrations = require('@sentry/integrations');
// eslint-disable-next-line no-useless-escape
const SENTRY_PATH_STRIP_RE = /^.*\/[^\.]+(\.app|CodePush|.*(?=\/))/;
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT,
  release: process.env.RELEASE,
  integrations: [
    new Integrations.CaptureConsole({
      levels: ['error'],
    }),
    new Integrations.RewriteFrames({
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

const { fadeOut } = require('lib/transitions/fade.js');
const Modernizr = require('modernizr');
const i18n = require('lib/i18n');

function init() {
  i18n.loadTranslation().then(() => {
    if (Modernizr.localstorage && Modernizr.webworkers && Modernizr.blobconstructor && Modernizr.getrandomvalues) {
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
