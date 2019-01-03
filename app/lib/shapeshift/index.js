'use strict';

var request = require('lib/request');
var urlRoot = 'https://shapeshift.io/';
var urlAuthRoot = 'https://auth.shapeshift.io/';
var prioritySymbols = ['BTC', 'BCH', 'ETH', 'LTC', 'XRP', 'XLM', 'EOS'];
var emitter = require('lib/emitter');
var getId = require('lib/wallet').getId;

var hasHandledMobileLogin = false;

emitter.on('handleOpenURL', function(url) {
  url = url || '';
  var matchAction = url.match(/action=([^&]+)/);
  if (!matchAction || matchAction[1] !== 'shapeshift-login') return;

  var matchAccessToken = url.match(/accessToken=([^&]+)/);
  var accessToken = matchAccessToken ? matchAccessToken[1] : '';
  setAccessToken(accessToken);
  hasHandledMobileLogin = true;
});

function isLogged() {
  return !!getAccessToken();
}

function login() {
  return new Promise(function(resolve, reject) {
    var width = 640;
    var height = 720;
    var options = 'width=' + width + ', ';
    options += 'height=' + height + ', ';
    options += 'left=' + ((screen.width - width) / 2) + ', ';
    options += 'top=' + ((screen.height - height) / 2) + '';
    var clientId = process.env.SHAPESHIFT_CLIENT_ID;
    var redirectUri = process.env.SITE_URL + 'shapeShiftRedirectUri?buildType=web';
    if (process.env.BUILD_TYPE === 'phonegap') {
      redirectUri = process.env.SITE_URL + 'shapeShiftRedirectUri?buildType=phonegap';
    }
    cleanAccessToken();
    var popup = window.open(urlAuthRoot + 'oauth/authorize?response_type=code&scope=users:read&client_id=' + clientId + '&redirect_uri=' + redirectUri, '_system', options);
    var popupInterval = setInterval(function() {
      if (popup.closed || hasHandledMobileLogin) {
        clearInterval(popupInterval);
        hasHandledMobileLogin = false;
        var token = getAccessToken();
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
    url: window.urlRoot + 'shapeShiftToken',
    method: 'delete',
    data: {
      token: getAccessToken(),
      id: getId()
    }
  }).then(function() {
    cleanAccessToken();
  });
}

function getCoins() {
  return request({
    url: urlRoot + 'getcoins'
  }).then(function(coins) {
    return getCoinsArray(coins);
  });
}

function validateAddress(address, symbol) {
  if (!address) return Promise.resolve(false);
  if (!symbol) return Promise.resolve(false);
  return request({
    url: urlRoot + 'validateAddress/' + address + '/' + symbol,
  }).then(function(data) {
    return !!data.isvalid;
  });
}

function shift(options) {
  var data = {
    withdrawal: options.toAddress,
    pair: (options.fromSymbol + '_' + options.toSymbol).toLowerCase(),
    apiKey: process.env.SHAPESHIFT_API_KEY
  };
  if (options.returnAddress) {
    data.returnAddress = options.returnAddress;
  }
  return request({
    url: urlRoot + 'shift',
    method: 'post',
    data: data,
    headers: {
      'Authorization': 'Bearer ' + getAccessToken()
    }
  }).then(function(data) {
    if (data.error) throw new Error(data.error);
    return {
      depositAddress: data.deposit,
      depositSymbol: data.depositType,
      toAddress: data.withdrawal,
      toSymbol: data.withdrawalType
    };
  });
}

function txStat(depositAddress) {
  return request({
    url: urlRoot + 'txStat/' + encodeURIComponent(depositAddress)
  }).then(function(data) {
    if (data.error && data.status !== 'failed') throw new Error(data.error);
    return data;
  });
}

function marketInfo(fromSymbol, toSymbol) {
  var pair = (fromSymbol + '_' + toSymbol).toLowerCase();
  return request({
    url: urlRoot + 'marketinfo/' + pair
  }).then(function(data) {
    if (data.error) throw new Error(data.error);
    return data;
  });
}

function getCoinsArray(coins) {
  prioritySymbols = prioritySymbols.filter(function(symbol) {
    return coins[symbol];
  });

  var symbols = Object.keys(coins);
  symbols = symbols.filter(function(symbol) {
    return prioritySymbols.indexOf(symbol) === -1;
  });

  var allSymbols = prioritySymbols.concat(symbols);

  return allSymbols.map(function(symbol) {
    var coin = coins[symbol];
    return {
      name: coin.name,
      symbol: coin.symbol,
      disabled: coin.status !== 'available',
    };
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
  isLogged: isLogged,
  login: login,
  logout: logout,
  cleanAccessToken: cleanAccessToken,
  getCoins: getCoins,
  validateAddress: validateAddress,
  shift: shift,
  txStat: txStat,
  marketInfo: marketInfo
};
