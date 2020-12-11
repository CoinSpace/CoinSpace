'use strict';

const request = require('lib/request');
const shapeshiftRoot = 'https://shapeshift.io/';
const urlAuthRoot = 'https://auth.shapeshift.io/';
const PRIORITY_SYMBOLS = ['BTC', 'BCH', 'BSV', 'ETH', 'LTC', 'XRP', 'XLM', 'EOS', 'DOGE', 'DASH'];
const Big = require('big.js');
const windowExtra = require('lib/window-extra');

function isLogged() {
  return !!getAccessToken();
}

async function login() {
  const clientId = process.env.SHAPESHIFT_CLIENT_ID;
  const redirectParams = encodeURIComponent(`buildType=${process.env.BUILD_TYPE}&hostname=${window.location.hostname}`);
  const redirectUri = process.env.SITE_URL + `api/v1/shapeShiftRedirectUri?${redirectParams}`;
  cleanAccessToken();
  // eslint-disable-next-line max-len
  const url = urlAuthRoot + 'oauth/authorize?response_type=code&scope=users:read&client_id=' + clientId + '&redirect_uri=' + redirectUri;

  const accessToken = await windowExtra.open({
    url,
    name: 'shapeshiftLogin',
    width: 640,
    height: 720,
  });

  if (!accessToken) throw new Error('empty_token');
  if (accessToken === 'is_not_verified') {
    cleanAccessToken();
    throw new Error('user_is_not_verified');
  }
  setAccessToken(accessToken);
}

function logout() {
  return request({
    url: window.urlRoot + 'api/v1/shapeShiftToken',
    method: 'delete',
    data: {
      token: getAccessToken(),
    },
    id: true,
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
      Authorization: 'Bearer ' + getAccessToken(),
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
