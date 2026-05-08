import * as state from './state.js';
import Account from './account/Account.js';
import { Amount } from '@coinspace/cs-common';
import { release } from './version.js';
import { setLanguage } from './i18n/i18n.js';
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

  account.on('update', async (context) => {
    switch (context) {
      case 'currency':
        state.currency.value = account.details.get('systemInfo').preferredCurrency;
        break;
      case 'language':
        await setLanguage(account.details.get('systemInfo').language);
        break;
      case 'user':
        state.user.value = account.user;
        break;
      case 'isHiddenBalance':
        state.isHiddenBalance.value = account.isHiddenBalance;
        break;
      case 'theme':
        state.theme.value = account.details.theme;
        break;
      case 'isOnion':
        state.isOnion.value = account.isOnion;
        setSentryConnection();
        break;
      default: {
        const result = [];
        state.cryptos.value.forEach(({ crypto, balance }) => {
          const wallet = account.wallet(crypto._id);
          if (wallet && wallet.balance.value !== balance.value) {
            account.setPlatformWalletsStateInitialized(wallet.crypto.platform, wallet);
          }
        });
        for (const wallet of account.wallets()) {
          const market = await account.market.getMarket(wallet.crypto._id, state.currency.value);
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
        state.cryptos.value = result;

        if (import.meta.env.VITE_PLATFORM === 'ios') {
          window.saveCryptosForExtensions(result);
        }
        setSentryUser();
      }
    }
  });
  account.on('logout', async () => {
    if (import.meta.env.VITE_PLATFORM === 'ios') {
      window.saveCryptosForExtensions();
    }
    setSentryUser();
    state.reset();
    await createAccount({ app, router });
    await setLanguage();
  });
}
