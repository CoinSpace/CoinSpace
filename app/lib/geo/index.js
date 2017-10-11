'use strict';

var xhr = require('lib/xhr')
var db = require('lib/db')
var getWallet = require('lib/wallet').getWallet
var getNetwork = require('lib/network')
var uriRoot = process.env.SITE_URL
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
  requestLocationEndpoint(false, 'POST', function(err, resp, body){
    if(!resp || resp.statusCode !== 201) {
      console.error(body)
      return callback(body)
    }
    callback(null)
  })
}

function search(network, callback) {
  requestLocationEndpoint(network, 'PUT', function(err, resp, body){
    if(!resp || resp.statusCode !== 200) {
      console.error(body)
      return callback(body)
    }
    callback(null, JSON.parse(body))
  })
}

function remove(sync){
  xhr({
    uri: uriRoot + "/location",
    headers: { "Content-Type": "application/json" },
    method: 'DELETE',
    sync: sync
  }, function(err, resp, body){
    if(!resp || resp.statusCode !== 200) {
      console.error(body)
    } else {
      console.log('location data removed')
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

      xhr({
        uri: uriRoot + "/location",
        headers: { "Content-Type": "application/json" },
        method: method,
        body: JSON.stringify(userInfo)
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
