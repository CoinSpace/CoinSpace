'use strict';

require('../application.scss');

var token = require('lib/network')()
var fadeOut = require('lib/transitions/loader').out
var Modernizr = require('modernizr')
var i18n = require('lib/i18n')

document.getElementsByTagName('html')[0].classList.add(token)
var containerEl = document.getElementById('loader')

Modernizr.on('indexeddb', function(hasIndexedDB){
  var supportsPouchDB = hasIndexedDB || Modernizr.websqldatabase

  i18n.loadTranslation().then(function() {
    if (supportsPouchDB && Modernizr.localstorage && Modernizr.webworkers && Modernizr.blobconstructor && Modernizr.getrandomvalues) {
      return import(
        /* webpackChunkName: 'application' */
        '../application'
      ).then(function() {
        fadeOut(containerEl)
      });
    } else {
      return import(
        /* webpackChunkName: 'nope' */
        './nope'
      );
    }
  })
})
