import { createApp as createVueApp } from 'vue';
import { utils } from '@coinspace/cs-common';

import { defineAppProperty, safeOpen } from './helpers.js';

export function createApp({ App, router }) {
  const app = createVueApp(App);
  router.$app = app;

  defineAppProperty(app, 'env', import.meta.env);
  defineAppProperty(app, '$showRampsAndExchange', !['mas', 'ios'].includes(import.meta.env.VITE_DISTRIBUTION));
  defineAppProperty(app, '$safeOpen', safeOpen);
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

  return app;
}
