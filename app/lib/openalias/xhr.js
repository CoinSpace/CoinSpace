var request = require('lib/request')
var urlRoot = process.env.SITE_URL
var getNetwork = require('lib/network')

function resolveTo(to, callback){
  if (getNetwork() != 'bitcoin') return callback({to: to});

  to = to || ''
  var hostname = to.replace('@', '.')
  if (!hostname.match(/\./)) return callback({to: to});
  request({
    url: urlRoot + '/openalias?hostname=' + hostname,
  }).then(function(data) {
    callback({to: data.address, alias: to})
  }).catch(function() {
    callback({to: to})
  })
}

module.exports = {
  resolveTo: resolveTo
}
