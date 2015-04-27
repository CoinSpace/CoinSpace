'use strict';

require('browsernizr/lib/load')
require('browsernizr/test/storage/localstorage')
require('browsernizr/test/storage/websqldatabase')
require('browsernizr/test/indexedDB')
require('browsernizr/test/workers/webworkers')
require('browsernizr/test/blob')
require('browsernizr/test/crypto/getrandomvalues')

var token = require('cs-network')()
var fadeOut = require('cs-transitions/loader.js').out
var Modernizr = require('browsernizr')
var languages = require('cs-i18n').languages

document.getElementsByTagName('html')[0].classList.add(token)

var containerEl = document.getElementById('loader')
var goodToGo;

Modernizr.on('indexeddb', function(hasIndexedDB){
  var supportsPouchDB = hasIndexedDB || Modernizr.websqldatabase
  var language = findTranslation()

  Modernizr.load({
    test: supportsPouchDB && (Modernizr.localstorage && Modernizr.webworkers && Modernizr.blobconstructor && Modernizr.getrandomvalues),
    yep: 'assets/js/application-' + language + '.js',
    nope: 'assets/js/nope-' + language + '.js',
    callback: function(testResult, key) {
      goodToGo = key
    },
    complete: function() {
      if(goodToGo) {
        setTimeout(function(){
          fadeOut(containerEl)
        }, 4500)
      }
    }
  })
})

function findTranslation(){
  var language = navigator.language.toLocaleLowerCase() || 'en'
  return languages.filter(function(l){
    return language === l || language.substr(0, 2) === l
  })[0] || 'en'
}

//monkey patch URL for safari 6
window.URL = window.URL || window.webkitURL
//fix for ie
window.location.origin = window.location.origin || window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '')
window.isIE = !!document.documentMode
