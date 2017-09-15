'use strict';

var translate = require('counterpart')

var languages = [
  'cs-cz', 'es', 'hu', 'ja', 'pl',
  'sr', 'zh-cn', 'de', 'fil', 'id',
  'nb', 'ru', 'th', 'en', 'fr',
  'it', 'nl', 'sr-latn-rs', 'uk'
]

translate.setSeparator('*')

var translation = require('./translations/' + process.env.LANGUAGE + '.json')
translate.registerTranslations(process.env.LANGUAGE, translation)
translate.setLocale(process.env.LANGUAGE)

function safeTranslate() {
  if (arguments[0] === undefined) return '';
  return translate.apply(null, arguments);
}

module.exports = {
  translate: safeTranslate,
  languages: languages
}
