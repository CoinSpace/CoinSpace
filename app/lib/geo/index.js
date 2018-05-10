'use strict';

var request = require('lib/request');
var db = require('lib/db');
var getWallet = require('lib/wallet').getWallet;
var getId = require('lib/wallet').getId;
var getTokenNetwork = require('lib/token').getTokenNetwork;
var urlRoot = process.env.SITE_URL;
var userInfo = {};
var networks = {
  BTC: 'bitcoin',
  BCH: 'bitcoincash',
  LTC: 'litecoin',
  ETH: 'ethereum'
};

function save(callback){
  requestLocationEndpoint(false, 'POST', callback)
}

function search(network, callback) {
  requestLocationEndpoint(network, 'PUT', callback)
}

function remove() {
  request({
    url: urlRoot + 'location',
    method: 'delete',
    data: {
      id: getId()
    }
  })
}

function getLocation(callback){
  if (!window.navigator.geolocation){
    return callback(new Error('Your browser does not support geolocation'))
  }

  var success = function(position){
    callback(null, position.coords.latitude, position.coords.longitude)
  }

  var error = function(){
      navigator.notification.alert(
          'Access to the geolocation has been prohibited; please enable it in the Settings app to continue',
          function(){},
          'Coin'
      )
    callback(new Error('Unable to retrieve your location'))
  }

  window.navigator.geolocation.getCurrentPosition(success, error)
}

function requestLocationEndpoint(network, method, callback){
  getLocation(function(err, lat, lon){
    if(err) return callback(err);

    var doc = db.get();
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
      url: urlRoot + 'location',
      method: method,
      data: userInfo
    }, callback);
  })
}

module.exports = {
  search: search,
  save: save,
  remove: remove,
  networks: networks
}
