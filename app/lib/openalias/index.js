var dns = require('dns')
var retry = require('retry')
var cloudflare = require('cloudflare')

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
        var data = addresses[i]

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

function createClient() {
  return cloudflare.createClient({
    email: process.env.CLOUDFLARE_EMAIL,
    token: process.env.CLOUDFLARE_TOKEN
  });
}

function add(username, address, callback) {
  var cloudflare = createClient()
  var name = username + '.' + process.env.CLOUDFLARE_DOMAIN
  var content = 'oa1:btc recipient_address=' + address + '; recipient_name=' + username + ';'

  cloudflare.addDomainRecord(process.env.CLOUDFLARE_DOMAIN, {
    type: 'TXT',
    name: name,
    content: content,
    ttl: 1
  }, function(err, data) {
    if (err) return callback(err);
    return callback(null, data.name.replace('.', '@'), data.rec_id)
  })
}

function edit(dnsRecordId, username, address, callback) {
  var cloudflare = createClient()
  var name = username + '.' + process.env.CLOUDFLARE_DOMAIN
  var content = 'oa1:btc recipient_address=' + address + '; recipient_name=' + username + ';'

  cloudflare.editDomainRecord(process.env.CLOUDFLARE_DOMAIN, dnsRecordId, {
    type: 'TXT',
    name: name,
    content: content,
    ttl: 1
  }, function(err, data) {
    if (err) return callback(err);
    data = data.rec.obj;
    return callback(null, data.name.replace('.', '@'), data.rec_id)
  })
}

module.exports = {
  resolve: resolve,
  add: add,
  edit: edit
}