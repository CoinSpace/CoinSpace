import { createApp as createVueApp } from 'vue';
import { utils } from '@coinspace/cs-common';

import { defineAppProperty, formatDuration, safeOpen } from './helpers.js';

export function createApp({ App, router }) {
  const app = createVueApp(App);
  router.$app = app;

  defineAppProperty(app, 'env', import.meta.env);
  defineAppProperty(app, '$showRampsAndExchangeAndStaking', import.meta.env.VITE_DISTRIBUTION !== 'android-huawei');
  defineAppProperty(app, '$safeOpen', safeOpen);
  defineAppProperty(app, '$tBrackets', (str) => {
    return str.match(/\(\((.+?)\)\)/g)?.map(s => s.slice(2, -2));
  });
  defineAppProperty(app, '$c', function(value, style = 'currency', options = {}) {
    if (!value) {
      return '';
    }
    const maximumFractionDigits = utils.getPrecision(value);
    return this.$n(Number(value), style, {
      maximumFractionDigits,
      currency: this.$currency,
      ...options,
    });
  });
  defineAppProperty(app, '$duration', function(seconds, style = 'long') {
    return formatDuration(seconds, this.$i18n.locale, style);
  });

  return app;
}
