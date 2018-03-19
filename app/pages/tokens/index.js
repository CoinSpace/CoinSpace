'use strict';

var Ractive = require('lib/ractive');
var showRemoveConfirmation = require('widgets/modals/confirm-remove-token');
var addEthereumToken = require('widgets/modals/add-ethereum-token');
var setToken = require('lib/token').setToken;
var getToken = require('lib/token').getToken;
var initWallet = require('lib/wallet').initWallet;
var emitter = require('lib/emitter');

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
      currentToken: getToken(), // string or object
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
    var currentToken = ractive.get('currentToken');
    var currentTokenNetwork = currentToken.network || currentToken;
    ractive.set('currentToken', token);
    setToken(token);

    var network = token.network || token;
    var baseUrl = window.location.href.split('?')[0];
    var url = baseUrl + '?network=' + network;
    window.history.replaceState(null, null, url);

    document.getElementsByTagName('html')[0].classList.replace(currentTokenNetwork, network);

    emitter.emit('sync');

    setTimeout(function() {
      initWallet(network, onSyncDone, onTxSyncDone);
    }, 200);

    function onSyncDone(err) {
      if (err) {
        return console.error(err);
      }
      window.scrollTo(0, 0);
      emitter.emit('wallet-ready');
    }
    function onTxSyncDone(err, transactions) {
      if (err) {
        emitter.emit('set-transactions', []);
        return console.error(err);
      }
      emitter.emit('set-transactions', transactions);
    }
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
