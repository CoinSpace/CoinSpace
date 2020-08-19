'use strict';

const request = require('lib/request');
const shapeshiftRoot = 'https://shapeshift.io/';
const urlAuthRoot = 'https://auth.shapeshift.io/';
const PRIORITY_SYMBOLS = ['BTC', 'BCH', 'BSV', 'ETH', 'LTC', 'XRP', 'XLM', 'EOS', 'DOGE', 'DASH'];
const emitter = require('lib/emitter');
const Big = require('big.js');
const { getId } = require('lib/wallet');

let hasHandledMobileLogin = false;

emitter.on('handleOpenURL', (url) => {
  url = url || '';
  const matchAction = url.match(/action=([^&]+)/);
  if (!matchAction || matchAction[1] !== 'shapeshift-login') return;

  const matchAccessToken = url.match(/accessToken=([^&]+)/);
  const accessToken = matchAccessToken ? matchAccessToken[1] : '';
  setAccessToken(accessToken);
  hasHandledMobileLogin = true;
});

emitter.on('wallet-reset', () => {
  cleanAccessToken();
});

function isLogged() {
  return !!getAccessToken();
}

function login() {
  return new Promise((resolve, reject) => {
    const width = 640;
    const height = 720;
    let options = 'width=' + width + ', ';
    options += 'height=' + height + ', ';
    options += 'left=' + ((screen.width - width) / 2) + ', ';
    options += 'top=' + ((screen.height - height) / 2) + '';
    const clientId = process.env.SHAPESHIFT_CLIENT_ID;
    const redirectUri = process.env.SITE_URL + 'v1/shapeShiftRedirectUri?buildType=' + process.env.BUILD_TYPE;
    cleanAccessToken();
    // eslint-disable-next-line max-len
    const url = urlAuthRoot + 'oauth/authorize?response_type=code&scope=users:read&client_id=' + clientId + '&redirect_uri=' + redirectUri;
    const popup = window.open(url, '_blank', options);
    // TODO rewrite to handle unload event in web and deep link in phonegap and electron
    // TODO add reasonable timeout
    const popupInterval = setInterval(() => {
      // popout is undefined in electron
      if ((popup && popup.closed) || hasHandledMobileLogin) {
        clearInterval(popupInterval);
        hasHandledMobileLogin = false;
        if (popup && !popup.closed && popup.close) {
          popup.close();
        }
        const token = getAccessToken();
        if (!token) return reject(new Error('empty_token'));
        if (token === 'is_not_verified') {
          cleanAccessToken();
          return reject(new Error('user_is_not_verified'));
        }
        return resolve();
      }
    }, 250);
  });
}

function logout() {
  return request({
    url: window.urlRoot + 'v1/shapeShiftToken',
    method: 'delete',
    data: {
      token: getAccessToken(),
      id: getId(),
    },
  }).then(() => {
    cleanAccessToken();
  });
}

function getCoins() {
  return request({
    url: shapeshiftRoot + 'getcoins',
  }).then((coins) => {
    return Object.keys(coins).filter((key) => {
      return coins[key].status === 'available';
    }).map((key) => {
      return {
        name: coins[key].name,
        symbol: coins[key].symbol,
      };
    }).sort((a, b) => {
      if (PRIORITY_SYMBOLS.indexOf(a.symbol) === -1 && PRIORITY_SYMBOLS.indexOf(b.symbol) === -1) {
        return (a.symbol > b.symbol) ? 1 : -1;
      }
      if (PRIORITY_SYMBOLS.indexOf(b.symbol) === -1) return -1;
      if (PRIORITY_SYMBOLS.indexOf(a.symbol) === -1) return 1;
      if (PRIORITY_SYMBOLS.indexOf(a.symbol) > PRIORITY_SYMBOLS.indexOf(b.symbol)) return 1;
      return -1;
    });
  });
}

function validateAddress(address, symbol) {
  if (!address) return Promise.resolve(false);
  if (!symbol) return Promise.resolve(false);
  return request({
    url: shapeshiftRoot + 'validateAddress/' + address + '/' + symbol,
  }).then((data) => {
    return !!data.isvalid;
  });
}

function shift(options) {
  const data = {
    withdrawal: options.toAddress,
    pair: (options.fromSymbol + '_' + options.toSymbol).toLowerCase(),
    apiKey: process.env.SHAPESHIFT_API_KEY,
  };
  if (options.returnAddress) {
    data.returnAddress = options.returnAddress;
  }
  return request({
    url: shapeshiftRoot + 'shift',
    method: 'post',
    data,
    headers: {
      'Authorization': 'Bearer ' + getAccessToken(),
    },
  }).then((data) => {
    if (data.error) throw new Error(data.error);
    return {
      depositAddress: data.deposit,
      depositSymbol: data.depositType,
      toAddress: data.withdrawal,
      toSymbol: data.withdrawalType,
    };
  });
}

function txStat(depositAddress) {
  return request({
    url: shapeshiftRoot + 'txStat/' + encodeURIComponent(depositAddress),
  }).then((data) => {
    if (data.error && data.status !== 'failed') throw new Error(data.error);
    return data;
  });
}

function marketInfo(fromSymbol, toSymbol) {
  const pair = (fromSymbol + '_' + toSymbol).toLowerCase();
  return request({
    url: shapeshiftRoot + 'marketinfo/' + pair,
  }).then((data) => {
    if (data.error) throw new Error(data.error);
    if (data.rate) {
      data.rate = Big(data.rate).toFixed();
    }
    return data;
  });
}

function cleanAccessToken() {
  window.localStorage.removeItem('_cs_shapeshift_token');
}

function getAccessToken() {
  return window.localStorage.getItem('_cs_shapeshift_token');
}

function setAccessToken(token) {
  window.localStorage.setItem('_cs_shapeshift_token', token);
}

module.exports = {
  isLogged,
  login,
  logout,
  cleanAccessToken,
  getCoins,
  validateAddress,
  shift,
  txStat,
  marketInfo,
};
