import { createI18n } from 'vue-i18n';
import { defaultLanguage, languages } from './languages.js';

const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  numberFormats: {
    en: {
      currency: {
        style: 'currency',
      },
      percent: {
        style: 'percent',
        signDisplay: 'exceptZero',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    },
  },
  datetimeFormats: {
    en: {
      chart1Y: {
        year: 'numeric', month: 'short', day: 'numeric',
      },
      short: {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: 'numeric', minute: 'numeric',
      },
      shortCurrentYear: {
        month: 'short', day: 'numeric',
        hour: 'numeric', minute: 'numeric',
      },
      hardware: {
        hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      },
    },
  },
  messageResolver(obj, path) {
    let msg = obj[path];
    if (path.startsWith('[template] ')) {
      msg = obj[path.replace('[template] ', '')]?.replace(/\(\(.+?\)\)/g, '');
    }
    return msg ? msg : null;
  },
});

export async function setLanguage(languageCode = defaultLanguageCode()) {
  languageCode = languageCode.split('-', 2).join('-').toLowerCase();

  let language = languages.find((item) => item.value === languageCode);
  if (!language) {
    const shortCode = languageCode.split('-')[0];
    language = languages.find((item) => item.value === shortCode) || defaultLanguage;
  }

  if (!Object.keys(i18n.global.messages[language.value] || {}).length) {
    const messages = await import(`./messages/${language.value}.json`);
    i18n.global.setLocaleMessage(language.value, messages.default);
    i18n.global.setNumberFormat(language.value, i18n.global.numberFormats.en);
    i18n.global.setDateTimeFormat(language.value, i18n.global.datetimeFormats.en);
  }
  i18n.global.locale = language.value;

  document.documentElement.setAttribute('dir', language.dir || 'ltr');
  document.documentElement.setAttribute('lang', language.value);
  localStorage.setItem('_cs_language', language.value);
}

function defaultLanguageCode() {
  if (import.meta.env.DEV) return 'en';
  return localStorage.getItem('_cs_language') || navigator.language || defaultLanguage.value;
}

export default i18n;
export { languages };
