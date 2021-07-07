import counterpart from 'counterpart';

const languages = [
  'bs', 'cs-cz', 'de', 'en', 'es', 'fil',
  'fr', 'hr', 'hu', 'id', 'it', 'ja',
  'km', 'ko', 'nb', 'nl', 'pl', 'pt-br', 'ru',
  'sr', 'th', 'tr', 'uk', 'vi', 'zh-cn',
];

counterpart.setSeparator('*');

counterpart.setMissingEntryGenerator((key) => {
  console.error('Missing translation: ' + key);
  return key;
});

function loadTranslation() {
  const language = getLanguage();
  return import(
    /* webpackChunkName: '[request]' */
    './translations/' + language
  ).then((translation) => {
    counterpart.registerTranslations(language, translation.default);
    counterpart.setLocale(language);
  });
}

export function translate() {
  if (arguments[0] === undefined) return '';
  return counterpart.apply(null, arguments);
}

function getLanguage() {
  const language = navigator.language.toLocaleLowerCase() || 'en';
  return languages.filter((l) => {
    return language === l || language.substr(0, 2) === l;
  })[0] || 'en';
}

export default {
  loadTranslation,
  translate,
  getLanguage,
};
