import counterpart from 'counterpart';
import languages from './list.json';

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
  const languageFull = navigator.language.toLowerCase() || 'en';
  const languageShort = languageFull.split('-')[0];
  return languages.filter((full) => {
    const short = full.split('-')[0];
    return full === languageFull || short === languageShort;
  })[0] || 'en';
}

export default {
  loadTranslation,
  translate,
  getLanguage,
};
