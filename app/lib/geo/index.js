'use strict';

var xhr = require('cs-xhr')
var db = require('cs-db')
var getWallet = require('cs-wallet-js').getWallet
var getNetwork = require('cs-network')
var uriRoot = window.location.origin
if(window.buildType === 'phonegap') {
  uriRoot = process.env.PHONEGAP_URL
}
var userInfo = {}

function fetchUserInfo(callback){
  db.get(function(err, doc){
    if(err) return callback(err);

    userInfo = {}
    userInfo.name = doc.userInfo.firstName
    userInfo.email = doc.userInfo.email
    userInfo.avatarIndex = doc.userInfo.avatarIndex
    userInfo.address = getWallet().getNextAddress()
    userInfo.network = getNetwork()

    callback()
  })
}

function save(callback){
  requestLocationEndpoint('POST', function(err, resp, body){
    if(!resp || resp.statusCode !== 201) {
      console.error(body)
      return callback(body)
    }
    callback(null)
  })
}

function search(callback){
  requestLocationEndpoint('PUT', function(err, resp, body){
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
    callback(new Error('Unable to retrieve your location'))
  }

  window.navigator.geolocation.getCurrentPosition(success, error)
}

function requestLocationEndpoint(method, callback){
  getLocation(function(err, lat, lon){
    if(err) return callback(err);

    fetchUserInfo(function(err){
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
  remove: remove
}
