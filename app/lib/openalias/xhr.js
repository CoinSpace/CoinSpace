var xhr = require('lib/xhr')
var uriRoot = process.env.SITE_URL
var getNetwork = require('lib/network')

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
