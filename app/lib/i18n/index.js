import counterpart from 'counterpart';
import languages from './list.json';

counterpart.setSeparator('*');

counterpart.setMissingEntryGenerator((key) => {
  console.error('Missing translation: ' + key);
  return key;
});

function loadTranslation(language) {
  language = getLanguage(language);
  return import(
    /* webpackChunkName: 'i18n/[request]' */
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

function getLanguage(language) {
  if (!language) {
    try {
      language = window.localStorage && localStorage.getItem('_cs_language');
    // eslint-disable-next-line no-empty
    } catch (err) {}
  }
  const languageFull = language || navigator.language.toLowerCase() || 'en';
  const languageShort = languageFull.split('-')[0];
  return languages.find((full) => {
    const short = full.split('-')[0];
    return full === languageFull || short === languageShort;
  }) || 'en';
}

export default {
  loadTranslation,
  translate,
  getLanguage,
};
