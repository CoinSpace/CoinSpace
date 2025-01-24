import * as EOSSymbols from '@coinspace/cs-eos-wallet/symbols';
import { CsWallet } from '@coinspace/cs-common';
import { ref } from 'vue';
import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';


import appRoutes from './routes/app.js';
import authRoutes from './routes/auth.js';
import designRoutes from './routes/design.js';

import {
  defineAppProperty,
  registerProtocolHandler,
} from '../lib/helpers.js';

const router = createRouter({
  history: import.meta.env.VITE_BUILD_TYPE === 'web' ?
    createWebHistory(import.meta.env.BASE_URL) : createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    ...appRoutes,
    ...authRoutes,
    ...import.meta.env.DEV ? designRoutes : [],
  ],
});

router.up = async () => {
  const parent = router.currentRoute.value.path.replace(/(\/[^/]*)$/, '') || '/';
  await router.replace(parent);
};

router.beforeEach((to, from) => {
  if (import.meta.env.DEV && to.meta.dev) return;
  const { $account, $app } = router;
  if (to.meta.requiresAuth && !$account.isCreated) {
    return { name: 'auth', replace: true };
  }
  if (to.meta.requiresAuth && $account.isLocked) {
    return { name: 'unlock', replace: true, force: true };
  }
  if (to.meta.crypto) {
    const wallet = $account.wallet(to.params.cryptoId);
    if (wallet) {
      setWalletProps($app, wallet);
      registerProtocolHandler(wallet.crypto, $account);
    } else {
      const crypto = $account.cryptoDB.get(to.params.cryptoId);
      if (crypto?.supported === true && crypto?.deprecated !== true) {
        return { name: 'crypto.add', replace: true, params: { cryptoId: to.params.cryptoId } };
      } else {
        return { name: 'home', replace: true };
      }
    }
  }
  const toDepth = to.path.split('/').length;
  const fromDepth = from.path.split('/').length;
  if (toDepth !== fromDepth) {
    to.meta.transition = toDepth > fromDepth ? 'slide-left' : 'slide-right';
  }
});

router.afterEach((to) => {
  const { $account, $app } = router;
  if (to.meta.crypto && $account.wallet(to.params.cryptoId)) {
    return;
  }
  unsetWalletProps($app);
});

if (import.meta.env.VITE_BUILD_TYPE === 'electron') {
  window.electron?.registerNavigateHandler((path) => {
    router.push({
      path,
      force: true,
    });
  });
}

if (import.meta.env.VITE_BUILD_TYPE === 'phonegap' ||
  (import.meta.env.VITE_BUILD_TYPE === 'web' && import.meta.env.DEV)) {
  window.navigateHandler = function(path) {
    router.push({
      path,
      force: true,
    });
  };
}

function setWalletProps($app, wallet) {
  const { $account } = router;
  defineAppProperty($app, '$wallet', wallet);
  const walletState = ref(wallet.state);
  defineAppProperty($app, '$walletState', walletState);

  const $loadWallet = async () => {
    if (walletState.value === CsWallet.STATE_LOADING) return;
    walletState.value = CsWallet.STATE_LOADING;
    try {
      await wallet.cleanup();
      await wallet.load();
      $account.emit('update');
    } catch (err) {
      console.error(err);
    }
    walletState.value = wallet.state;
  };
  defineAppProperty($app, '$loadWallet', $loadWallet);

  if (wallet.state !== CsWallet.STATE_LOADED) {
    $loadWallet();
  }
  defineAppProperty($app, '$STATE_LOADING', CsWallet.STATE_LOADING);
  defineAppProperty($app, '$STATE_LOADED', CsWallet.STATE_LOADED);
  defineAppProperty($app, '$STATE_NEED_ACTIVATION', EOSSymbols.STATE_NEED_ACTIVATION);
  defineAppProperty($app, '$STATE_ERROR', CsWallet.STATE_ERROR);
}

function unsetWalletProps($app) {
  delete $app.config.globalProperties.$wallet;
  delete $app.config.globalProperties.$walletState;
  delete $app.config.globalProperties.$loadWallet;
  delete $app.config.globalProperties.$STATE_LOADING;
  delete $app.config.globalProperties.$STATE_LOADED;
  delete $app.config.globalProperties.$STATE_NEED_ACTIVATION;
  delete $app.config.globalProperties.$STATE_ERROR;
}

export default router;
