import AppLayout from '../../layouts/AppLayout.vue';

import HomeView from '../../views/HomeView.vue';

import CryptoViewBuy from '../../views/Crypto/CryptoViewBuy.vue';
import CryptoViewInfo from '../../views/Crypto/CryptoViewInfo.vue';
import CryptoViewSell from '../../views/Crypto/CryptoViewSell.vue';

import CryptoAddView from '../../views/Crypto/Add/CryptoAddView.vue';
import CryptoDerivationView from '../../views/Crypto/Derivation/CryptoDerivationView.vue';
import CryptoEosSetupView from '../../views/Crypto/EosSetup/CryptoEosSetupView.vue';
import CryptoExchangeView from '../../views/Crypto/Exchange/CryptoExchangeView.vue';
import CryptoExportView from '../../views/Crypto/Export/CryptoExportView.vue';
import CryptoHistoryView from '../../views/Crypto/History/CryptoHistoryView.vue';
import CryptoImportView from '../../views/Crypto/Import/CryptoImportView.vue';
import CryptoIndexView from '../../views/Crypto/Index/CryptoIndexView.vue';
import CryptoReceiveView from '../../views/Crypto/Receive/CryptoReceiveView.vue';
import CryptoSendView from '../../views/Crypto/Send/CryptoSendView.vue';

import SettingsAccountView from '../../views/Settings/Account/SettingsAccountView.vue';
import SettingsHardwareView from '../../views/Settings/Hardware/SettingsHardwareView.vue';
import SettingsPinView from '../../views/Settings/Pin/SettingsPinView.vue';
import SettingsView from '../../views/Settings/SettingsView.vue';

import NotFound from '../../views/NotFound.vue';

import { parseCryptoURI } from '../../lib/cryptoURI.js';
import schemes from '../../lib/schemes.js';

const app = [
  {
    path: '/',
    component: AppLayout,
    children: [{
      path: '',
      name: 'home',
      component: HomeView,
    }, {
      path: 'settings',
      children: [{
        path: '',
        name: 'settings',
        component: SettingsView,
      }, {
        path: 'account',
        name: 'settings.account',
        component: SettingsAccountView,
      }, {
        path: 'hardware',
        name: 'settings.hardware',
        component: SettingsHardwareView,
      }, {
        path: 'pin',
        name: 'settings.pin',
        component: SettingsPinView,
      }],
    }, {
      path: 'add/:cryptoId([a-z0-9-]+@[a-z0-9-]+)?',
      name: 'crypto.add',
      component: CryptoAddView,
    }, {
      path: ':cryptoId([a-z0-9-]+@[a-z0-9-]+)',
      meta: { crypto: true },
      children: [
        {
          path: '',
          name: 'crypto',
          component: CryptoIndexView,
        },
        {
          path: 'buy',
          name: 'crypto.buy',
          component: CryptoViewBuy,
        },
        {
          path: 'sell',
          name: 'crypto.sell',
          component: CryptoViewSell,
        },
        {
          path: 'info',
          name: 'crypto.info',
          component: CryptoViewInfo,
        },
        {
          path: 'derivation',
          name: 'crypto.derivation',
          component: CryptoDerivationView,
        },
        {
          path: 'export',
          name: 'crypto.export',
          component: CryptoExportView,
        },
        {
          path: 'history',
          name: 'crypto.history',
          component: CryptoHistoryView,
        },
        {
          path: 'receive',
          name: 'crypto.receive',
          component: CryptoReceiveView,
        },
        {
          path: 'send',
          name: 'crypto.send',
          component: CryptoSendView,
        },
        {
          path: 'exchange',
          name: 'crypto.exchange',
          component: CryptoExchangeView,
        },
        {
          path: 'import',
          name: 'crypto.import',
          component: CryptoImportView,
        },
        {
          path: 'eossetup',
          name: 'crypto.eossetup',
          component: CryptoEosSetupView,
        },
      ],
    }, {
      //path: 'bip21/:data',
      path: ':cryptoId([a-z0-9-]+@[a-z0-9-]+)?/bip21/:data',
      redirect(to) {
        try {
          const parsed = parseCryptoURI(to.params.data);
          const crypto = schemes.find((item) => item.scheme === parsed.scheme);
          if (crypto) {
            return {
              name: 'crypto.send',
              query: {
                address: parsed.address,
                amount: parsed.amount,
              },
              params: {
                cryptoId: crypto._id,
              },
              force: true,
            };
          }
        } catch (err) {
          console.error(err);
        }
        return {
          name: 'home',
          force: true,
        };
      },
    }],
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notfound',
    component: NotFound,
  },
];

export default app;
