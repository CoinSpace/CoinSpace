import * as state from './state.js';
import { createApp as createVueApp } from 'vue';
import { CsWallet, utils } from '@coinspace/cs-common';

import { defineAppProperty, formatDuration, safeOpen } from './helpers.js';

export function createApp({ App, router }) {
  const app = createVueApp(App);
  router.$app = app;

  defineAppProperty(app, 'env', import.meta.env);
  defineAppProperty(app, '$showRampsAndExchangeAndStaking', true);
  defineAppProperty(app, '$safeOpen', safeOpen);
  defineAppProperty(app, '$tBrackets', (str) => {
    return str.match(/\(\((.+?)\)\)/g)?.map(s => s.slice(2, -2));
  });
  defineAppProperty(app, '$fiat', function(value = 0, style = 'currency', options = {}) {
    return this.$n(Number(value), style, {
      currency: this.$currency,
      ...options,
    });
  });
  defineAppProperty(app, '$fiatPrecise', function(value = 0, style = 'currency', options = {}) {
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

  defineAppProperty(app, '$currency', state.currency);
  defineAppProperty(app, '$user', state.user);
  defineAppProperty(app, '$cryptos', state.cryptos);
  defineAppProperty(app, '$isHiddenBalance', state.isHiddenBalance);
  defineAppProperty(app, '$isOnion', state.isOnion);
  defineAppProperty(app, '$resolvedTheme', state.resolvedTheme);
  defineAppProperty(app, '$walletState', state.walletState);

  defineAppProperty(app, '$STATE_LOADING', CsWallet.STATE_LOADING);
  defineAppProperty(app, '$STATE_LOADED', CsWallet.STATE_LOADED);
  defineAppProperty(app, '$STATE_ERROR', CsWallet.STATE_ERROR);

  return app;
}
