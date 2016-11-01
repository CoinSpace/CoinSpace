var xhr = require('cs-xhr')
var uriRoot = window.location.origin
if(window.buildType === 'phonegap') {
  uriRoot = process.env.PHONEGAP_URL
}
var getNetwork = require('cs-network')

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

module.exports = {
  resolveTo: resolveTo
}