'use strict';

var translate = require('counterpart')

var languages = [
  'cs-cz', 'de', 'en', 'es', 'fil',
  'fr', 'hu', 'id', 'it', 'ja',
  'nb', 'nl', 'pl', 'pt-br', 'ru',
  'th', 'uk', 'zh-cn'
]

translate.setSeparator('*')

translate.setMissingEntryGenerator(function(key) {
  console.error('Missing translation: ' + key);
  return key;
});

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

function getLanguage() {
  var language = navigator.language.toLocaleLowerCase() || 'en'
  return languages.filter(function(l) {
    return language === l || language.substr(0, 2) === l
  })[0] || 'en'
}

module.exports = {
  loadTranslation: loadTranslation,
  translate: safeTranslate,
  getLanguage: getLanguage
}
