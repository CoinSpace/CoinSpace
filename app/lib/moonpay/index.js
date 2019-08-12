'use strict';

var request = require('lib/request');
var urlRoot = window.urlRoot;
var coins = {};

function init() {
  var url = urlRoot + 'moonpay/coins';
  return request({url: url}).then(function(data) {
    coins = data;
  }).catch(console.error);
}

function isSupported(symbol) {
  return coins[symbol];
}

function show(currencyCode, walletAddress) {
  var baseUrl = process.env.MOONPAY_WIDGET_URL + '&';

  var redirectURL;
  if (process.env.BUILD_TYPE === 'phonegap') {
    redirectURL = 'coinspace://?action=moonpay';
  } else {
    redirectURL = window.location.href;
  }

  var params = {
    currencyCode: currencyCode,
    walletAddress: walletAddress,
    redirectURL: encodeURIComponent(redirectURL),
    feeBreakdown: false
  };

  var queryString = Object.keys(params).map(function(key) {
    return key + '=' + params[key];
  }).join('&');

  baseUrl += queryString;
  window.open(baseUrl, '_system');
  return false;
}

module.exports = {
  init: init,
  isSupported: isSupported,
  show: show
}
