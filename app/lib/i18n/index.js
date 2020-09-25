'use strict';

const translate = require('counterpart');

const languages = [
  'bs', 'cs-cz', 'de', 'en', 'es', 'fil',
  'fr', 'hr', 'hu', 'id', 'it', 'ja',
  'km', 'ko', 'nb', 'nl', 'pl', 'pt-br', 'ru',
  'sr', 'th', 'uk', 'vi', 'zh-cn',
];

translate.setSeparator('*');

translate.setMissingEntryGenerator((key) => {
  console.error('Missing translation: ' + key);
  return key;
});

function loadTranslation() {
  const language = getLanguage();
  return import(
    /* webpackChunkName: '[request]' */
    './translations/' + language
  ).then((translation) => {
    translate.registerTranslations(language, translation);
    translate.setLocale(language);
  });
}

function safeTranslate() {
  if (arguments[0] === undefined) return '';
  return translate.apply(null, arguments);
}

function getLanguage() {
  const language = navigator.language.toLocaleLowerCase() || 'en';
  return languages.filter((l) => {
    return language === l || language.substr(0, 2) === l;
  })[0] || 'en';
}

module.exports = {
  loadTranslation,
  translate: safeTranslate,
  getLanguage,
};
