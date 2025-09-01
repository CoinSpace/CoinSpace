import * as EOSSymbols from '@coinspace/cs-eos-wallet/symbols';
import Account from './account/Account.js';
import { ref } from 'vue';
import { release } from './version.js';
import { setLanguage } from './i18n/i18n.js';
import { Amount, CsWallet } from '@coinspace/cs-common';
import { cryptoSubtitle, cryptoToFiat, defineAppProperty, roundCrypto } from './helpers.js';
import { setSentryConnection, setSentryUser } from './sentry.js';

export async function createAccount({ app, router }) {
  const account = new Account({
    localStorage: window.localStorage,
    release,
  });
  await account.biometry.init();

  defineAppProperty(app, '$account', account);
  router.$account = account;

  const currency = ref('USD');
  const user = ref({
    username: '',
    email: '',
  });
  const cryptos = ref([]);
  const isHiddenBalance = ref(false);
  const isOnion = ref(account.isOnion);

  defineAppProperty(app, '$wallet', undefined);
  defineAppProperty(app, '$walletState', undefined);
  defineAppProperty(app, '$STATE_LOADING', CsWallet.STATE_LOADING);
  defineAppProperty(app, '$STATE_LOADED', CsWallet.STATE_LOADED);
  defineAppProperty(app, '$STATE_NEED_ACTIVATION', EOSSymbols.STATE_NEED_ACTIVATION);
  defineAppProperty(app, '$STATE_ERROR', CsWallet.STATE_ERROR);
  defineAppProperty(app, '$currency', currency);
  defineAppProperty(app, '$user', user);
  defineAppProperty(app, '$cryptos', cryptos);
  defineAppProperty(app, '$isHiddenBalance', isHiddenBalance);
  defineAppProperty(app, '$isOnion', isOnion);

  const dummyBalances = {
    'bitcoin@bitcoin': '0.5',
    'ethereum@ethereum': '0.5',
    'tether@ethereum': '100',
    'xrp@ripple': '2300',
    'monero@monero': '69',
    'dogecoin@dogecoin': '400',
    'cardano@cardano': '220',
    'litecoin@litecoin': '50',
    'dash@dash': '1',
    'toncoin@toncoin': '900',
  };

  setSentryUser(account.clientStorage.getId());

  account.on('update', async (context) => {
    switch (context) {
      case 'currency':
        currency.value = account.details.get('systemInfo').preferredCurrency;
        break;
      case 'language':
        await setLanguage(account.details.get('systemInfo').language);
        break;
      case 'user':
        user.value = account.user;
        break;
      case 'isHiddenBalance':
        isHiddenBalance.value = account.isHiddenBalance;
        break;
      case 'isOnion':
        isOnion.value = account.isOnion;
        setSentryConnection(account.isOnion);
        break;
      default: {
        const result = [];
        cryptos.value.forEach(({ crypto, balance }) => {
          const wallet = account.wallet(crypto._id);
          if (wallet && wallet.balance.value !== balance.value) {
            account.setPlatformWalletsStateInitialized(wallet.crypto.platform, wallet);
          }
        });
        for (const wallet of account.wallets()) {
          const market = await account.market.getMarket(wallet.crypto._id, currency.value);
          if (account.isDummy && dummyBalances[wallet.crypto._id]) {
            Object.defineProperty(wallet, 'balance', {
              get() {
                return Amount.fromString(dummyBalances[wallet.crypto._id], wallet.crypto.decimals);
              },
              enumerable: true,
              configurable: true,
            });
          }
          result.push({
            crypto: wallet.crypto,
            platform: wallet.platform,
            balance: wallet.balance,
            balanceRound: market?.price ? roundCrypto(wallet.balance, market.price) : wallet.balance,
            balanceFiat: market?.price ? Number(cryptoToFiat(wallet.balance, market.price)) : 0,
            rank: wallet.crypto.meta?.rank || Infinity,
            title: wallet.crypto.symbol,
            subtitle: cryptoSubtitle(wallet),
            market,
          });
        }
        result.sort((a, b) => {
          if (a.balanceFiat > b.balanceFiat) return -1;
          if (a.balanceFiat < b.balanceFiat) return 1;
          if (a.balance.value > b.balance.value) return -1;
          if (a.balance.value < b.balance.value) return 1;
          if (a.rank < b.rank) return -1;
          if (a.rank > b.rank) return 1;
          if (a.crypto.original && !b.crypto.original) return -1;
          if (!a.crypto.original && b.crypto.original) return 1;
          return a.crypto.symbol.localeCompare(b.crypto.symbol);
        });
        cryptos.value = result;

        if (import.meta.env.VITE_PLATFORM === 'ios') {
          window.saveCryptosForWidget(result);
        }
      }
    }
  });
  account.on('logout', async () => {
    if (import.meta.env.VITE_PLATFORM === 'ios') {
      window.saveCryptosForWidget();
    }
    await createAccount({ app, router });
  });
}
