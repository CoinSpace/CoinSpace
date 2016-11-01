var dns = require('dns')
var retry = require('retry')

function resolve(hostname, callback) {
  var prefix = 'btc'
  var operation = retry.operation({
    retries: 3,
    factor: 1,
    minTimeout: 500,
    maxTimeout: 1000,
    randomize: true
  });

  operation.attempt(function() {
    dns.resolveTxt(hostname, function(err, addresses) {
      if(operation.retry(err)) {
        return;
      }
      if(err) return callback(operation.mainError());

      for (var i = 0; i < addresses.length; i++){
        var data = addresses[i][0]

        if(!data.match('^oa1:' + prefix)) continue;

        var match = data.match('recipient_address=([A-Za-z0-9]+)')
        if(!match) continue;
        var address = match[1]

        match = data.match('recipient_name=([^;]+)')
        var name = match ? match[1] : ''

        return callback(null, address, name);
      }
      return callback({'error': 'No OpenAlias record found.'});
    });
  });
}

module.exports = {
  resolve: resolve
}