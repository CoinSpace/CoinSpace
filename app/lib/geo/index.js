'use strict';

const request = require('lib/request');
const details = require('lib/wallet/details');
const { getWallet } = require('lib/wallet');
const { getId } = require('lib/wallet');
const { getTokenNetwork } = require('lib/token');
const { urlRoot } = window;
let userInfo = {};
const networks = {
  BTC: 'bitcoin',
  BCH: 'bitcoincash',
  BSV: 'bitcoinsv',
  LTC: 'litecoin',
  ETH: 'ethereum',
  XRP: 'ripple',
  XLM: 'stellar',
  EOS: 'eos',
  DOGE: 'dogecoin',
  DASH: 'dash',
};

function save(callback) {
  requestLocationEndpoint(false, 'POST', callback);
}

function search(network, callback) {
  requestLocationEndpoint(network, 'PUT', callback);
}

function remove() {
  request({
    url: urlRoot + 'v1/location',
    method: 'delete',
    data: {
      id: getId(),
    },
  });
}

function getLocation(callback) {
  if (!window.navigator.geolocation) {
    return callback(new Error('Your browser does not support geolocation'));
  }

  const success = function(position) {
    callback(null, position.coords.latitude, position.coords.longitude);
  };

  const error = function() {
    const alert = navigator.notification ? navigator.notification.alert : window.alert;
    alert(
      'Access to the geolocation has been prohibited; please enable it in the Settings app to continue',
      () => {},
      'Coin'
    );
    callback(new Error('Unable to retrieve your location'));
  };

  window.navigator.geolocation.getCurrentPosition(success, error, process.env.BUILD_TYPE === 'electron' ? {
    enableHighAccuracy: true,
  } : {});
}

function requestLocationEndpoint(network, method, callback) {
  getLocation((err, lat, lon) => {
    if (err) return callback(err);

    if (process.env.NODE_ENV === 'development') {
      console.info(`Current location: https://www.google.com/maps/place/${lat},${lon}`);
    }

    const doc = details.get();
    userInfo = {};
    userInfo.id = getId();
    userInfo.name = doc.userInfo.firstName;
    userInfo.email = doc.userInfo.email;
    userInfo.avatarIndex = doc.userInfo.avatarIndex;
    userInfo.address = getWallet().getNextAddress();
    userInfo.network = network || getTokenNetwork();
    userInfo.lat = lat;
    userInfo.lon = lon;

    request({
      url: urlRoot + 'v1/location',
      method,
      data: userInfo,
    }, callback);
  });
}

module.exports = {
  search,
  save,
  remove,
  networks,
};
