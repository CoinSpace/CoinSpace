var xhr = require('cs-xhr')
var uriRoot = window.location.origin
if(window.buildType === 'phonegap') {
  uriRoot = process.env.PHONEGAP_URL
}
var db = require('cs-db')
var CS = require('cs-wallet-js')
var getNetwork = require('cs-network')

function setUsername(firstName, callback){
  if(getNetwork() != 'bitcoin') return callback({error: 'OpenAlias enabled only for Bitcoin'})

  db.get(function(err, doc){
    if(err) return callback(err);

    var oldUsername = (doc.userInfo.firstName || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
    var username = (firstName || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
    var address = getAddress()

    if(username == oldUsername) return callback(null, doc.userInfo.alias, doc.userInfo.firstName);

    xhr({
      uri: uriRoot + "/username",
      headers: { "Content-Type": "application/json" },
      method: 'POST',
      body: JSON.stringify({id: db.userID(), username: username, address: address})
    }, function(err, resp, body){
      if(resp.statusCode !== 200) {
        console.error(body)
        return callback(JSON.parse(body))
      }
      var data = JSON.parse(body)
      callback(null, data.alias, data.username)
    })
  })
}

function resolveTo(to, callback){
  if(getNetwork() != 'bitcoin') return callback({to: to})

  to = to || ''
  var hostname = to.replace('@', '.')
  if(!hostname.match(/\./)) return callback({to: to})
  xhr({
    uri: uriRoot + "/openalias?hostname=" + hostname,
    method: 'GET'
  }, function(err, resp, body){
    if(resp.statusCode !== 200) {
      console.error(body)
      return callback({to: to})
    }
    var data = JSON.parse(body)
    callback({to: data.address, alias: to})
  })
}

function getAddress(){
  return CS.getWallet().getNextAddress()
}

module.exports = {
  setUsername: setUsername,
  resolveTo: resolveTo
}