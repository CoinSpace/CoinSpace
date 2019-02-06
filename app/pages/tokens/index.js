'use strict';

var Ractive = require('lib/ractive');
var showRemoveConfirmation = require('widgets/modals/confirm-remove-token');
var addEthereumToken = require('widgets/modals/add-ethereum-token');
var setToken = require('lib/token').setToken;
var getToken = require('lib/token').getToken;
var initWallet = require('lib/wallet').initWallet;
var emitter = require('lib/emitter');
var db = require('lib/db');
var _ = require('lodash');
var onSyncDoneWrapper = require('lib/wallet/utils').onSyncDoneWrapper;
var onTxSyncDoneWrapper = require('lib/wallet/utils').onTxSyncDoneWrapper;

var walletTokens = [];
var isEnabled = false;

module.exports = function(el) {

  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      title: 'Available Tokens',
      id: 'token_dropdown',
      currentToken: '',
      isCurrentToken: function(token) {
        return _.isEqual(token, this.get('currentToken'));
      },
      switchToken: switchToken,
      removeEthereumToken: removeEthereumToken,
      ethereumTokens: [],
    }
  })

  emitter.on('sync', function() {
    isEnabled = false;
  });

  emitter.on('set-transactions', function() {
    isEnabled = true;
  });

  ractive.on('before-show', function() {
    walletTokens = db.get('walletTokens') || [];
    var ethereumTokens = walletTokens.filter(function(token) {
      return token.network === 'ethereum';
    });
    ractive.set('ethereumTokens', ethereumTokens);
    ractive.set('currentToken', getToken());
  });

  function switchToken(token) {
    if (token === ractive.get('currentToken')) return;
    if (!isEnabled) return;
    var currentToken = ractive.get('currentToken');
    var currentTokenNetwork = currentToken.network || currentToken;

    var network = token.network || token;
    var baseUrl = window.location.href.split('?')[0];
    var url = baseUrl + '?network=' + network;

    ractive.set('currentToken', token);
    setToken(token);

    window.history.replaceState(null, null, url);
    document.getElementsByTagName('html')[0].classList.remove(currentTokenNetwork);
    document.getElementsByTagName('html')[0].classList.add(network);

    emitter.emit('sync');

    var onSyncDone = onSyncDoneWrapper({
      success: function() {
        window.scrollTo(0, 0);
        emitter.emit('wallet-ready');
      }
    });
    var onTxSyncDone = onTxSyncDoneWrapper();
    setTimeout(function() {
      initWallet(network, onSyncDone, onTxSyncDone);
    }, 200);
  }

  function removeEthereumToken(token) {
    var index = ractive.get('ethereumTokens').indexOf(token);
    showRemoveConfirmation(token, walletTokens, function() {
      ractive.splice('ethereumTokens', index, 1);
    });
    return false;
  }

  ractive.on('add-ethereum-token', function() {
    addEthereumToken(walletTokens, function(token) {
      ractive.push('ethereumTokens', token);
    });
  });

  return ractive;
}
