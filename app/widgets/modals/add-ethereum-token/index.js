'use strict';

var Ractive = require('widgets/modals/base');
var showError = require('widgets/modals/flash').showError;
var qrcode = require('lib/qrcode');
var emitter = require('lib/emitter');

function open() {

  var tokens = [
    {address: '0x00000', name: 'EOS', symbol: 'EOS', decimals: 18, network: 'ethereum'},
    {address: '0x00001', name: 'Reputation', symbol: 'REP', decimals: 18, network: 'ethereum'},
  ];

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
      token: tokens[0],
      tokens: tokens,
    }
  });

  ractive.on('clearContractAddress', function() {
    var input = ractive.find('#contract_address');
    ractive.set('contractAddress', '');
    input.focus();
  });

  ractive.on('add', function() {
    // ractive.set('isLoading', true);

    var token = ractive.get('token');
    if (!token) {
      token = {
        address: ractive.get('contractAddress'),
        symbol: ractive.get('symbol'),
        decimals: ractive.get('decimals')
      }
    }
    // validate token here
    console.log('add token', token);
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
