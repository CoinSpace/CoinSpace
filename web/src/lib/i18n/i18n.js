import { createI18n } from 'vue-i18n';
import { languages } from './languages.js';

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
});

export async function setLanguage(language = defaultLanguage()) {
  language = language.split('-', 2).join('-').toLowerCase();

  const hasLanguage = !!languages.find((item) => item.value === language);
  if (!hasLanguage) {
    const short = language.split('-')[0];
    language = languages.find((item) => item.value === short)?.value || 'en';
  }

  if (!Object.keys(i18n.global.messages[language] || {}).length) {
    const messages = await import(`./messages/${language}.json`);
    i18n.global.setLocaleMessage(language, messages.default);
    i18n.global.setNumberFormat(language, i18n.global.numberFormats.en);
    i18n.global.setDateTimeFormat(language, i18n.global.datetimeFormats.en);
  }
  i18n.global.locale = language;
  localStorage.setItem('_cs_language', language);
}

function defaultLanguage() {
  if (import.meta.env.DEV) return 'en';
  return localStorage.getItem('_cs_language') || navigator.language || 'en';
}

export default i18n;
export { languages };
