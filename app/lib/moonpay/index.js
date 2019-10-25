'use strict';

var request = require('lib/request');
var urlRoot = window.urlRoot;
var coins = {};
var emitter = require('lib/emitter');
var showSuccess = require('widgets/modals/moonpay-success');

var hasHandledMobileSuccess = false;
var apiKey = process.env.MOONPAY_API_KEY;
var customer;
var fiat;

emitter.on('handleOpenURL', function(url) {
  url = url || '';
  var matchAction = url.match(/action=([^&]+)/);
  if (!matchAction || matchAction[1] !== 'moonpay-success') return;
  hasHandledMobileSuccess = true;
  window.localStorage.setItem('_cs_moonpay_success', 'true');
});

function init() {
  return request({url: 'https://api.moonpay.io/v3/ip_address', params: {apiKey: apiKey}}).then(function(data) {
    if (data && data.isAllowed) return request({
      url: urlRoot + 'moonpay/coins',
      params: {country: data.alpha3}
    });
  }).then(function(data) {
    if (!data) return;
    coins = data;
  }).catch(console.error);
}

function loadFiat() {
  if (fiat) return Promise.resolve();
  return request({url: urlRoot + 'moonpay/fiat'}).then(function(data) {
    fiat = data;
  }).catch(console.error);
}

function getFiatById(id, field) {
  if (field) {
    return fiat[id] ? fiat[id][field] : '';
  }
  return fiat[id];
}

function isSupported(symbol) {
  return !!coins[symbol];
}

function isLogged() {
  return !!getAccessToken();
}

function signIn(email, securityCode) {
  if (email === '' || email.indexOf('@') === -1 || email.indexOf('.') === -1) {
    return Promise.reject(new Error('invalid_email'));
  }
  if (securityCode === '') {
    return Promise.reject(new Error('invalid_security_code'));
  }
  return request({
    url: 'https://api.moonpay.io/v3/customers/email_login',
    method: 'post',
    params: {apiKey: apiKey},
    data: {email: email, securityCode: securityCode}
  }).catch(function(err) {
    if (/Invalid body/.test(err.message)) {
      if (securityCode) throw new Error('invalid_security_code');
      throw new Error('invalid_email');
    }
    if (/Invalid security code/.test(err.message)) throw new Error('invalid_security_code');
    throw err;
  });
}

function limits() {
  return request({
    url: 'https://api.moonpay.io/v3/customers/me/limits',
    headers: {
      'Authorization': 'Bearer ' + getAccessToken()
    }
  });
}

function refreshToken() {
  return request({
    url: 'https://api.moonpay.io/v3/customers/refresh_token',
    params: {apiKey: apiKey},
    headers: {
      'Authorization': 'Bearer ' + getAccessToken()
    }
  });
}

function getAccessToken() {
  return window.localStorage.getItem('_cs_moonpay_token');
}

function setAccessToken(token) {
  window.localStorage.setItem('_cs_moonpay_token', token);
}

function cleanAccessToken() {
  window.localStorage.removeItem('_cs_moonpay_token');
}

function getCustomer() {
  return customer;
}

function setCustomer(data) {
  customer = data;
}

function cleanCustomer() {
  customer = undefined;
}

module.exports = {
  init: init,
  loadFiat: loadFiat,
  getFiatById: getFiatById,
  isSupported: isSupported,
  isLogged: isLogged,
  signIn: signIn,
  limits: limits,
  refreshToken: refreshToken,
  setAccessToken: setAccessToken,
  cleanAccessToken: cleanAccessToken,
  getCustomer: getCustomer,
  setCustomer: setCustomer,
  cleanCustomer: cleanCustomer
}
