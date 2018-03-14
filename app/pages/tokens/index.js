'use strict';

var Ractive = require('lib/ractive');
var getNetwork = require('lib/network');
var showRemoveConfirmation = require('widgets/modals/confirm-remove-token');

module.exports = function(el) {

  var tokens = [
    {address: '0x00000', name: 'EOS', symbol: 'EOS', decimals: 18, network: 'ethereum'},
    {address: '0x00001', name: 'Reputation', symbol: 'REP', decimals: 18, network: 'ethereum'}
  ];

  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      title: 'Available Tokens',
      id: 'token_dropdown',
      ethereumTokens: tokens.filter(function(token) {
        return token.network === 'ethereum'
      }),
      isCurrentToken: isCurrentToken
    }
  })

  function isCurrentToken(network, tokenId) {
    // currentToken should belong to currentNetwork or be undefined;
    // var currentToken = {address: '0x00000', name: 'EOS', symbol: 'EOS', decimals: 18, network: 'ethereum'};
    var currentToken;
    var currentNetwork = getNetwork();
    if (currentNetwork !== network) return false;
    if (currentNetwork === 'ethereum' && currentToken) {
      return tokenId === currentToken.address;
    }
    return tokenId === undefined;
  }

  ractive.on('switch', function(context) {
    var network = context.node.dataset.network;
    var tokenId = context.node.dataset.tokenId;
    if (isCurrentToken(network, tokenId)) return;
    console.log('Switch to network:' + network + ' tokenId: ' + tokenId);
    // var url = window.location.href.replace(/\?network=\w+/, '') + '?network=' + token
    // window.location.assign(url);
  });

  ractive.on('add-ethereum-token', function() {
    console.log('add-ethereum-token');
  });

  ractive.on('remove-ethereum-token', function(context) {
    var ethereumTokens = ractive.get('ethereumTokens');
    var token = ethereumTokens.filter(function(item) {
      return item.address === context.node.dataset.tokenId;
    })[0];
    var index = ethereumTokens.indexOf(token);
    showRemoveConfirmation(token, tokens, function() {
      ractive.splice('ethereumTokens', index, 1);
    });
    return false;
  });

  return ractive
}
