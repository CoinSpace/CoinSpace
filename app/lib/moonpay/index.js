'use strict';

var request = require('lib/request');
var urlRoot = window.urlRoot;
var coins = {};
var emitter = require('lib/emitter');
var showSuccess = require('widgets/modals/moonpay-success');

var hasHandledMobileSuccess = false;

emitter.on('handleOpenURL', function(url) {
  url = url || '';
  var matchAction = url.match(/action=([^&]+)/);
  if (!matchAction || matchAction[1] !== 'moonpay-success') return;
  hasHandledMobileSuccess = true;
  window.localStorage.setItem('_cs_moonpay_success', 'true');
});

function init() {
  return request({url: 'https://api.moonpay.io/v2/ip_address'}).then(function(data) {
    if (data && data.isAllowed) return request({url: urlRoot + 'moonpay/coins'});
  }).then(function(data) {
    if (!data) return;
    coins = data;
  }).catch(console.error);
}

function isSupported(symbol) {
  return coins[symbol];
}

function show(currencyCode, walletAddress) {
  var baseUrl = process.env.MOONPAY_WIDGET_URL + '&';

  var redirectURL = process.env.SITE_URL + 'moonpay/redirectURL?buildType=web';
  if (process.env.BUILD_TYPE === 'phonegap') {
    redirectURL = process.env.SITE_URL + 'moonpay/redirectURL?buildType=phonegap';
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

  var width = 550;
  var height = 550;
  var options = 'width=' + width + ', ';
  options += 'height=' + height + ', ';
  options += 'left=' + ((screen.width - width) / 2) + ', ';
  options += 'top=' + ((screen.height - height) / 2) + '';

  window.localStorage.removeItem('_cs_moonpay_success');
  var popup = window.open(baseUrl, '_system', options);
  var popupInterval = setInterval(function() {
    if (popup.closed || hasHandledMobileSuccess) {
      clearInterval(popupInterval);
      hasHandledMobileSuccess = false;
      if (window.localStorage.getItem('_cs_moonpay_success') === 'true') {
        showSuccess();
      }
    }
  }, 250);

  return false;
}

module.exports = {
  init: init,
  isSupported: isSupported,
  show: show
}
