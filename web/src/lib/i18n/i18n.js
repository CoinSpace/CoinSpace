import { createI18n } from 'vue-i18n';

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

export const languages = [
  { value: 'id', name: 'Bahasa Indonesia' },
  { value: 'bs', name: 'Bosanski' },
  { value: 'cs', name: 'Čeština' },
  { value: 'de', name: 'Deutsch' },
  { value: 'en', name: 'English' },
  { value: 'es', name: 'Español' },
  { value: 'fr', name: 'Français' },
  { value: 'hr', name: 'Hrvatski' },
  { value: 'it', name: 'Italiano' },
  { value: 'hu', name: 'Magyar' },
  { value: 'nl', name: 'Nederlands' },
  { value: 'nb', name: 'Norsk bokmål' },
  { value: 'pl', name: 'Polski' },
  { value: 'pt-br', name: 'Português brasileiro' },
  { value: 'sr', name: 'Srpski' },
  { value: 'vi', name: 'Tiếng Việt' },
  { value: 'tr', name: 'Türkçe' },
  { value: 'fil', name: 'Filipino' },
  { value: 'ru', name: 'Русский' },
  { value: 'uk', name: 'Українська' },
  { value: 'th', name: 'ภาษาไทย' },
  { value: 'km', name: 'ភាសាខ្មែរ' },
  { value: 'ko', name: '한국어' },
  { value: 'ja', name: '日本語' },
  { value: 'zh-cn', name: '汉语' },
];

export default i18n;
