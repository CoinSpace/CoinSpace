'use strict';

var Ractive = require('widgets/modals/base');
var showError = require('widgets/modals/flash').showError;
var qrcode = require('lib/qrcode');
var emitter = require('lib/emitter');
var request = require('lib/request');
var urlRoot = process.env.SITE_URL;
var db = require('lib/db');

var tokens = [];

function open(walletTokens, callback) {

  var ractive = new Ractive({
    partials: {
      content: require('./_content.ract')
    },
    data: {
      isLoading: false,
      qrScannerAvailable: qrcode.isScanAvailable,
      contractAddress: '',
      symbol: '',
      decimals: '',
      tokens: tokens,
      token: tokens[0],
      isInited: tokens.length !== 0
    }
  });

  if (tokens.length === 0) {
    request({
      url: urlRoot + 'ethereum/tokens'
    }).then(function(data) {
      tokens = data;
      ractive.set({
        tokens: tokens,
        token: tokens[0],
        isInited: true
      });
    }).catch(console.error);
  }

  ractive.on('clearContractAddress', function() {
    var input = ractive.find('#contract_address');
    ractive.set('contractAddress', '');
    input.focus();
  });

  ractive.on('add', function() {
    ractive.set('isLoading', true);

    var token = ractive.get('token');
    var data = {
      address: token ? token.address : ractive.get('contractAddress'),
      symbol: token ? token.symbol : ractive.get('symbol'),
      name: token ? token.name : ractive.get('symbol'),
      decimals: token ? token.decimals : ractive.get('decimals'),
      network: 'ethereum'
    }

    if (!data.address || !data.symbol || typeof data.decimals !== 'number') {
      return handleError(new Error('Please fill out all fields.'));
    }

    walletTokens.push(data);

    db.set('walletTokens', walletTokens).then(function() {
      callback(data);
      ractive.fire('cancel');
    }).catch(function(err) {
      console.error(err);
      ractive.fire('cancel');
    });
  });

  ractive.on('open-qr', function() {
    qrcode.scan({context: 'ethereum-contract-address'});
  });

  emitter.on('prefill-wallet', function(contractAddress, context) {
    if (context !== 'ethereum-contract-address') return;
    ractive.set('contractAddress', contractAddress);
  });

  function handleError(err) {
    ractive.set('isLoading', false);
    showError({message: err.message});
  }

  return ractive;
}

module.exports = open
