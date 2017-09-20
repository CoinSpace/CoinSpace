'use strict';

var translate = require('counterpart')

var languages = [
  'cs-cz', 'es', 'hu', 'ja', 'pl',
  'sr', 'zh-cn', 'de', 'fil', 'id',
  'nb', 'ru', 'th', 'en', 'fr',
  'it', 'nl', 'sr-latn-rs', 'uk'
]

translate.setSeparator('*')

function loadTranslation() {
  var language = getLanguage()
  return import(
    /* webpackChunkName: '[request]' */
    './translations/' + language
  ).then(function(translation) {
    translate.registerTranslations(language, translation)
    translate.setLocale(language)
  });
}

function safeTranslate() {
  if (arguments[0] === undefined) return '';
  return translate.apply(null, arguments);
}

function getLanguage(){
  var language = navigator.language.toLocaleLowerCase() || 'en'
  return languages.filter(function(l){
    return language === l || language.substr(0, 2) === l
  })[0] || 'en'
}

module.exports = {
  loadTranslation: loadTranslation,
  translate: safeTranslate
}
