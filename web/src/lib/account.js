import Account from './account/Account.js';
import { ref } from 'vue';
import { release } from './version.js';
import { setLanguage } from './i18n/i18n.js';
import { cryptoSubtitle, cryptoToFiat, defineAppProperty, roundCrypto } from './helpers.js';

export async function createAccount({ app, router }) {
  const account = new Account({
    localStorage: window.localStorage,
    siteURL: import.meta.env.VITE_SITE_URL,
    release,
  });
  await account.biometry.init();
  await account.hardware.init();

  defineAppProperty(app, '$account', account);
  router.$account = account;

  const currency = ref('USD');
  const user = ref({
    username: '',
    email: '',
  });
  const cryptos = ref([]);

  defineAppProperty(app, '$currency', currency);
  defineAppProperty(app, '$user', user);
  defineAppProperty(app, '$cryptos', cryptos);

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
      default: {
        const result = [];
        for (const wallet of account.wallets()) {
          const market = await account.market.getMarket(wallet.crypto._id, currency.value);
          result.push({
            crypto: wallet.crypto,
            platform: wallet.platform,
            balance: wallet.balance,
            balanceRound: market?.price ? roundCrypto(wallet.balance, market.price) : wallet.balance,
            balanceFiat: market?.price ? Number(cryptoToFiat(wallet.balance, market.price)) : 0,
            rank: wallet.crypto.rank || Infinity,
            title: wallet.crypto.symbol,
            subtitle: cryptoSubtitle(wallet),
            market,
          });
        }
        result.sort((a, b) => {
          if (a.balanceFiat > b.balanceFiat) return -1;
          if (a.balanceFiat < b.balanceFiat) return 1;
          if (a.rank < b.rank) return -1;
          if (a.rank > b.rank) return 1;
          return a.crypto.symbol.localeCompare(b.crypto.symbol);
        });
        cryptos.value = result;
      }
    }
  });
  account.on('logout', async () => {
    await createAccount({ app, router });
  });
}
