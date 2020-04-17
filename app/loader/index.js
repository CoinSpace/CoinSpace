'use strict';

require('../application.scss');
require('core-js/shim');

var Sentry = require('@sentry/browser');
var Integrations = require('@sentry/integrations');
var SENTRY_PATH_STRIP_RE = /^.*\/[^\.]+(\.app|CodePush|.*(?=\/))/;
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT,
  release: process.env.SENTRY_RELEASE,
  integrations: [
    new Integrations.CaptureConsole({
      levels: ['error']
    }),
    new Integrations.RewriteFrames({
      iteratee: function(frame) {
        if (frame.filename !== '[native code]' && frame.filename !== '<anonymous>') {
          frame.filename = frame.filename.replace(/^file\:\/\//, '').replace(SENTRY_PATH_STRIP_RE, '');
        }
        return frame;
      }
    })
  ],
});

var token = require('lib/token');
var fadeOut = require('lib/transitions/fade.js').fadeOut;
var Modernizr = require('modernizr')
var i18n = require('lib/i18n')

function init() {
  i18n.loadTranslation().then(function() {
    if (Modernizr.localstorage && Modernizr.webworkers && Modernizr.blobconstructor && Modernizr.getrandomvalues) {
      setupNetwork();

      document.getElementsByTagName('html')[0].classList.add(token.getTokenNetwork())
      var containerEl = document.getElementById('loader')

      return import(
        /* webpackChunkName: 'application' */
        '../application'
      ).then(function() {
        fadeOut(containerEl, function() {
          window.initCSApp();
        });
      });
    } else {
      nope();
    }
  }).catch(function(err) {
    if (/Loading chunk \d+ failed/.test(err.message)) return chunkError();
    console.error(err);
  });
}

function setupNetwork() {
  var networks = ['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash', 'ethereum', 'ripple', 'stellar', 'eos'];
  var defaultNetwork = networks[0];
  var lastNetwork = token.getTokenNetwork();

  if (networks.indexOf(lastNetwork) === -1) {
    lastNetwork = defaultNetwork;
    token.setToken(lastNetwork);
  }

  var regex = /^network=/
  var networkParam = window.location.search.substr(1).split('&').filter(function(e) {
    return e.match(regex)
  })[0];
  var queryNetwork = networkParam ? networkParam.replace(regex, '') : null;

  if (networks.indexOf(queryNetwork) === -1) {
    var baseUrl = window.location.href.split('?')[0];
    var url = baseUrl + '?network=' + lastNetwork;
    return window.history.replaceState(null, null, url);
  }

  if (queryNetwork !== lastNetwork) {
    return token.setToken(queryNetwork);
  }
}

function nope() {
  var message = i18n.translate('Sorry, Coin Wallet did not load.') +
  '<br/><br/>' +
  i18n.translate('Try updating your browser, or switching out of private browsing mode. If all else fails, download Chrome for your device.')
  document.getElementById('loader-message').innerHTML = message;
}

function chunkError() {
  var message = 'Sorry, Coin Wallet did not load.' +
  '<br/><br/>' +
  'Please check your internet connection.';
  document.getElementById('loader-message').innerHTML = message;
}

init();
