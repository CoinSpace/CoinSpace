'use strict';

var Ractive = require('lib/ractive');
var showRemoveConfirmation = require('widgets/modals/confirm-remove-token');
var addEthereumToken = require('widgets/modals/add-ethereum-token');

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
      currentToken: 'ethereum', // string or object
      isCurrentToken: function(token) {
        return this.get('currentToken') === token;
      },
      switchToken: switchToken,
      removeEthereumToken: removeEthereumToken,
      ethereumTokens: tokens.filter(function(token) {
        return token.network === 'ethereum'
      }),
    }
  })

  function switchToken(token) {
    if (token === ractive.get('currentToken')) return;
    ractive.set('currentToken', token);
  }

  function removeEthereumToken(token) {
    var index = ractive.get('ethereumTokens').indexOf(token);
    showRemoveConfirmation(token, tokens, function() {
      ractive.splice('ethereumTokens', index, 1);
    });
    return false;
  }

  ractive.on('add-ethereum-token', function() {
    addEthereumToken();
  });

  return ractive
}
