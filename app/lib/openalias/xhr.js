var request = require('lib/request')
var urlRoot = window.urlRoot;
var getTokenNetwork = require('lib/token').getTokenNetwork;

function resolveTo(to, callback){
  if (getTokenNetwork() !== 'bitcoin') return callback({to: to});

  to = to || ''
  var hostname = to.replace('@', '.')
  if (!hostname.match(/\./)) return callback({to: to});
  request({
    url: urlRoot + 'openalias?hostname=' + hostname,
  }, function(err, data) {
    if (err) return callback({to: to});
    return callback({to: data.address, alias: to});
  });
}

module.exports = {
  resolveTo: resolveTo
}
