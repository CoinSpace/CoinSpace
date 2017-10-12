'use strict';

var request = require('lib/request')
var db = require('lib/db')
var getWallet = require('lib/wallet').getWallet
var getNetwork = require('lib/network')
var urlRoot = process.env.SITE_URL
var userInfo = {}
var networks = {
  BTC: 'bitcoin',
  LTC: 'litecoin',
  ETH: 'ethereum'
}

function fetchUserInfo(network, callback){
  db.get(function(err, doc){
    if(err) return callback(err);

    userInfo = {}
    userInfo.name = doc.userInfo.firstName
    userInfo.email = doc.userInfo.email
    userInfo.avatarIndex = doc.userInfo.avatarIndex
    userInfo.address = getWallet().getNextAddress()
    userInfo.network = network || getNetwork()

    callback()
  })
}

function save(callback){
  requestLocationEndpoint(false, 'POST', callback)
}

function search(network, callback) {
  requestLocationEndpoint(network, 'PUT', callback)
}

function remove() {
  request({
    url: urlRoot + '/location',
    method: 'delete'
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
          'Coin Space'
      )
    callback(new Error('Unable to retrieve your location'))
  }

  window.navigator.geolocation.getCurrentPosition(success, error)
}

function requestLocationEndpoint(network, method, callback){
  getLocation(function(err, lat, lon){
    if(err) return callback(err);

    fetchUserInfo(network, function(err){
      if(err) {
        console.error(err)
        //proceed with an earlier version of userInfo
      }

      userInfo.lat = lat
      userInfo.lon = lon

      request({
        url: urlRoot + '/location',
        method: method,
        data: userInfo
      }, callback)
    })
  })
}

module.exports = {
  search: search,
  save: save,
  remove: remove,
  networks: networks
}
