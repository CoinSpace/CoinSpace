var request = require('lib/request')
var urlRoot = window.urlRoot;
var getTokenNetwork = require('lib/token').getTokenNetwork;

function resolveTo(to) {
  if (getTokenNetwork() !== 'bitcoin') return Promise.resolve({to: to});

  to = to || ''
  var hostname = to.replace('@', '.')
  if (!hostname.match(/\./)) return Promise.resolve({to: to});
  return request({
    url: urlRoot + 'openalias?hostname=' + hostname,
  }).then(function(data) {
    return {to: data.address, alias: to};
  }).catch(function() {
    return {to: to};
  });
}

module.exports = {
  resolveTo: resolveTo
}
