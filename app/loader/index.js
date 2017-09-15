'use strict';

require('../application.scss');

var token = require('lib/network')()
var fadeOut = require('lib/transitions/loader').out
var Modernizr = require('modernizr')
var languages = require('lib/i18n').languages
var load = require('little-loader')

document.getElementsByTagName('html')[0].classList.add(token)
var containerEl = document.getElementById('loader')

Modernizr.on('indexeddb', function(hasIndexedDB){
  var supportsPouchDB = hasIndexedDB || Modernizr.websqldatabase
  var language = findTranslation()

  var callback = function(error) {
    if (error) return console.log(error);
    fadeOut(containerEl)
  }

  if (supportsPouchDB && Modernizr.localstorage && Modernizr.webworkers && Modernizr.blobconstructor && Modernizr.getrandomvalues) {
    // load('assets/js/application-' + language + '.js', callback);
    load('assets/js/application.' + __webpack_hash__ + '.js', callback);
  } else {
    // load('assets/js/nope-' + language + '.js', callback);
    load('assets/js/nope.' + __webpack_hash__ + '.js', callback);
  }
})

function findTranslation(){
  var language = navigator.language.toLocaleLowerCase() || 'en'
  return languages.filter(function(l){
    return language === l || language.substr(0, 2) === l
  })[0] || 'en'
}
