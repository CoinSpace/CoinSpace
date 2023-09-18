import './assets/styles/app.scss';
import './lib/sentry.js';

import App from './App.vue';
import { createAccount } from './lib/account.js';
import { createApp } from './lib/app.js';
import router from './router/router.js';
import i18n, { setLanguage } from './lib/i18n/i18n.js';

async function main() {
  if (import.meta.env.VITE_BUILD_TYPE === 'phonegap') {
    await (await import('../../phonegap/deviceready.js')).default();
  }

  const app = createApp({ App, router });
  await createAccount({ app, router });
  await setLanguage();
  app.use(i18n);
  app.use(router);
  app.mount('#app');
}

main().catch(console.error);
