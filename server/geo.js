var geomodel = require('geomodel').create_geomodel()

var SEARCH_RADIUS = 1000
var records = {}

function all(){
  return Object.keys(records).map(function(key){
    return records[key]
  })
}

function reset(){
  records = {}
}

function save(lat, lon, userInfo, callback) {
  try {
    var user = cloneObject(userInfo)
    user.location = geomodel.create_point(lat, lon)
    user.geocells = geomodel.generate_geocells(user.location)
    user.timestamp = new Date().getTime()

    records[user.id] = user

    callback()
  } catch(e) {
    callback(e)
  }
}

function remove(id) {
  delete records[id]
}

function getIdsOlderThan(age) {
  var now = new Date().getTime()
  return all().filter(function(e){
    return now - e.timestamp > age
  }).map(function(e){
    return e.id
  })
}

function search(lat, lon, userInfo, callback){
  try {
    var location = geomodel.create_point(lat, lon)
    var id = userInfo.id
    var network = userInfo.network

    var onGeocells = function(geocells, finderCallback) {
      var candidates = all().filter(function(record){
        var recordQualifies = (record.id !== id && haveIntersection(record.geocells, geocells))
        return recordQualifies && (network == null || record.network == network)
      })
      finderCallback(null, candidates)
    }

    geomodel.proximity_fetch(location, 10, SEARCH_RADIUS, onGeocells, callback)
  } catch(e) {
    callback(e)
  }
}


function haveIntersection(a1, a2){
  return a1.some(function(e){
    return a2.indexOf(e) > -1
  })
}

function cloneObject(obj){
  return JSON.parse(JSON.stringify(obj))
}

module.exports = {
  SEARCH_RADIUS: SEARCH_RADIUS,
  all: all,
  reset: reset,
  save: save,
  search: search,
  remove: remove,
  getIdsOlderThan: getIdsOlderThan
}
