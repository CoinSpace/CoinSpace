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

router.beforeEach(async (to, from) => {
  if (import.meta.env.DEV && to.meta.dev) return;
  const { $account, $app } = router;
  if (to.meta.requiresAuth && !$account.isCreated) {
    return { name: 'auth', replace: true };
  }
  if (to.meta.requiresAuth && $account.isLocked) {
    return { name: 'unlock', replace: true };
  }
  if (to.meta.crypto) {
    const accountIndex = to.query.account !== undefined ? parseInt(to.query.account, 10) : undefined;
    const wallet = await $account.getOrCreateWalletInstance(to.params.cryptoId, accountIndex);
    if (wallet) {
      setWalletProps($app, wallet);
      registerProtocolHandler(wallet.crypto, $account);
    } else {
      const crypto = $account.cryptoDB.get(to.params.cryptoId);
      if (crypto?.supported && !crypto?.deprecated) {
        return { name: 'crypto.add', replace: true, query: { cryptoId: to.params.cryptoId } };
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
  if (to.name === from.name) {
    to.meta.ts = Date.now();
  }
});

router.afterEach((to) => {
  const { $account, $app } = router;
  if (to.meta.crypto && $app.config.globalProperties.$wallet) {
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

const walletState = ref(undefined);

function setWalletProps($app, wallet) {
  const { $account } = router;
  defineAppProperty($app, '$wallet', wallet);
  walletState.value = wallet.state;
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
    walletState.value = $app.config.globalProperties.$wallet?.state;
  };
  defineAppProperty($app, '$loadWallet', $loadWallet);

  if (wallet.state !== CsWallet.STATE_LOADED) {
    $loadWallet();
  }
}

function unsetWalletProps($app) {
  defineAppProperty($app, '$wallet', undefined);
  defineAppProperty($app, '$loadWallet', undefined);
  walletState.value = undefined;
}

export default router;
