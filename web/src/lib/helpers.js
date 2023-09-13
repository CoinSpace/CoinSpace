import { prettyVersion } from './version.js';
import stringify from 'fast-json-stable-stringify';
import {
  Amount,
  utils,
} from '@coinspace/cs-common';

import { isRef, unref } from 'vue';

export function cryptoSubtitle(wallet) {
  const list = [wallet.crypto.name];
  if (wallet.crypto.type === 'token') {
    list.push(wallet.platform.name);
  }
  return list.join('\xa0• ');
}

export function cryptoSubtitleWithSymbol(wallet) {
  const list = [wallet.crypto.symbol];
  if (wallet.crypto.type === 'token') {
    list.push(wallet.platform.name);
  }
  return list.join('\xa0• ');
}

export function safeOpen(url) {
  if (url.startsWith('https://support.coin.space/')) {
    url = `${url}?tf_24464158=${encodeURIComponent(prettyVersion)}`;
  }
  const win = window.open(url, '_blank');
  if (win) {
    win.opener = null;
  }
  return false;
}

export function cryptoToFiat(amount, price, decimals) {
  return utils.atomToFiat(amount.value, price, decimals || amount.decimals);
}

export function fiatToCrypto(fiat, price, decimal) {
  const value = utils.fiatToAtom(fiat, price, decimal);
  return new Amount(value, decimal);
}

export function roundCrypto(amount, price) {
  return utils.atomToRoundUnit(amount.value, amount.decimals, price);
}

export function measureText(text) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = '16px sans-serif';
  return ctx.measureText(text);
}

export const periodToDays = {
  '1D': '1d',
  '7D': '7d',
  '14D': '14d',
  '1M': '30d',
  '1Y': '365d',
};

export function defineAppProperty(app, property, value) {
  Object.defineProperty(app.config.globalProperties, property, {
    enumerable: true,
    configurable: true,
    ...isRef(value) ? { get: () => unref(value) } : { value },
  });
}

export function objectsIsEqual(a, b) {
  return stringify(a) === stringify(b);
}

export function isValidEmail(email) {
  return /^[^@]+@\w+(\.\w+)+\w$/.test(email);
}

export function isValidUsername(username) {
  return /^[a-z0-9-]{1,63}$/.test(username);
}

export function registerProtocolHandler(crypto) {
  if (import.meta.env.VITE_PLATFORM !== 'web') return;
  if (!navigator.registerProtocolHandler) return;
  if (crypto.scheme) {
    const handler = new URL(`${import.meta.env.BASE_URL}${crypto._id}/bip21/%s`, import.meta.env.VITE_SITE_URL);
    try {
      navigator.registerProtocolHandler(crypto.scheme, handler, 'Coin Wallet');
    } catch (e) {
      try {
        navigator.registerProtocolHandler(`web+${crypto.scheme}`, handler, 'Coin Wallet');
        // eslint-disable-next-line
      } catch (e) {}
    }
  }
}

export function deepFreeze(object) {
  const propNames = Reflect.ownKeys(object);
  for (const name of propNames) {
    const value = object[name];
    if ((value && typeof value === 'object') || typeof value === 'function') {
      deepFreeze(value);
    }
  }
  return Object.freeze(object);
}

export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
