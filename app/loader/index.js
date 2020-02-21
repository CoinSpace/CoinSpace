'use strict';

require('../application.scss');
require('core-js/shim');

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
      return import(
        /* webpackChunkName: 'nope' */
        './nope'
      );
    }
  })
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

init();
