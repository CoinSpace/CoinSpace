'use strict';

var Ractive = require('lib/ractive');
var getNetwork = require('lib/network');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      title: 'Available Tokens',
      id: 'token_dropdown',
      ethereumTokens: [
        {address: '0x00000', name: 'EOS', symbol: 'EOS', decimals: 18, network: 'ethereum'},
        {address: '0x00001', name: 'Reputation', symbol: 'REP', decimals: 18, network: 'ethereum'}
      ],
      isCurrentToken: isCurrentToken
    }
  })

  function isCurrentToken(network, token) {
    // currentToken should belong to currentNetwork or be undefined;
    // var currentToken = {address: '0x00000', name: 'EOS', symbol: 'EOS', decimals: 18, network: 'ethereum'};
    var currentToken;
    var currentNetwork = getNetwork();
    if (currentNetwork !== network) return false;
    if (network === 'ethereum' && currentToken) {
      return token === currentToken.address;
    }
    return currentToken === token;
  }

  ractive.on('switch', function(context) {
    var network = context.node.dataset.network;
    var token = context.node.dataset.token;
    if (isCurrentToken(network, token)) return;
    console.log('Switch to network:' + network + ' token: ' + token);
    // var url = window.location.href.replace(/\?network=\w+/, '') + '?network=' + token
    // window.location.assign(url);
  });

  ractive.on('add-ethereum-token', function() {
    console.log('add-ethereum-token');
  });
  ractive.on('remove-ethereum-token', function(context) {
    var token = context.node.dataset.token;
    console.log('remove-ethereum-token', token);
    return false;
  });

  return ractive
}
