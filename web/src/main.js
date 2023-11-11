// polyfills
import 'core-js/es/string/replace-all';
import 'core-js/es/array/at';

import './assets/styles/app.scss';
import './lib/sentry.js';

import App from './App.vue';
import { createAccount } from './lib/account.js';
import { createApp } from './lib/app.js';
import router from './router/router.js';
import i18n, { setLanguage } from './lib/i18n/i18n.js';

async function main() {
  document.addEventListener('touchstart', () => {}, false); // fix safari :active css bug
  if (import.meta.env.VITE_BUILD_TYPE === 'phonegap') {
    await (await import('../../phonegap/lib/deviceready.js')).default();
  }

  const app = createApp({ App, router });
  await createAccount({ app, router });
  await setLanguage();
  app.use(i18n);
  app.use(router);
  app.mount('#app');
}

main().catch(console.error);
