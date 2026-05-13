import { ref } from 'vue';

const defaults = () => ({
  currency: 'USD',
  user: { username: '', email: '' },
  cryptos: [],
  isHiddenBalance: false,
  isOnion: false,
  resolvedTheme: document.documentElement.dataset.theme,
  walletState: undefined,
});

const d = defaults();

export const currency = ref(d.currency);
export const user = ref(d.user);
export const cryptos = ref(d.cryptos);
export const isHiddenBalance = ref(d.isHiddenBalance);
export const isOnion = ref(d.isOnion);
export const resolvedTheme = ref(d.resolvedTheme);
export const walletState = ref(d.walletState);

export function reset() {
  const d = defaults();
  currency.value = d.currency;
  user.value = d.user;
  cryptos.value = d.cryptos;
  isHiddenBalance.value = d.isHiddenBalance;
  isOnion.value = d.isOnion;
  resolvedTheme.value = d.resolvedTheme;
  walletState.value = d.walletState;
}
