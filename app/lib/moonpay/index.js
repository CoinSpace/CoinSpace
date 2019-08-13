'use strict';

var request = require('lib/request');
var urlRoot = window.urlRoot;
var coins = {};
var emitter = require('lib/emitter');
var showTos = require('widgets/modals/moonpay-success');

emitter.on('handleOpenURL', function(url) {
  url = url || '';
  var matchAction = url.match(/action=([^&]+)/);
  if (!matchAction || matchAction[1] !== 'moonpay-success') return;
  showTos();
});

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
    redirectURL = 'coinspace://?action=moonpay-success';
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
