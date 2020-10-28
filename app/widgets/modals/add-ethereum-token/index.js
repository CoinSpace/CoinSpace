'use strict';

const Ractive = require('widgets/modals/base');
const { showError } = require('widgets/modals/flash');
const qrcode = require('lib/qrcode');
const request = require('lib/request');
const { urlRoot } = window;
const details = require('lib/wallet/details');

let tokens = [];
let ractive;

function open(walletTokens, callback) {

  ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
    },
    data: {
      isLoading: false,
      qrScannerAvailable: qrcode.isScanAvailable,
      contractAddress: '',
      symbol: '',
      decimals: '',
      tokens,
      token: '-1',
      isInited: tokens.length !== 0,
    },
  });

  if (tokens.length === 0) {
    request({
      url: urlRoot + 'api/v1/ethereum/tokens',
    }).then((data) => {
      tokens = data;
      ractive.set({
        tokens,
        isInited: true,
      });
    }).catch(console.error);
  }

  ractive.on('clearContractAddress', () => {
    const input = ractive.find('#contract_address');
    ractive.set('contractAddress', '');
    input.focus();
  });

  ractive.on('add', () => {
    ractive.set('isLoading', true);

    const token = ractive.get('token');
    const data = {
      address: token ? token.address : ractive.get('contractAddress').trim(),
      symbol: token ? token.symbol : ractive.get('symbol').trim(),
      name: token ? token.name : ractive.get('symbol').trim(),
      decimals: token ? token.decimals : ractive.get('decimals'),
      network: 'ethereum',
    };

    if (!data.address || !data.symbol || typeof data.decimals !== 'number') {
      return handleError(new Error('Please fill out all fields.'));
    }

    walletTokens.push(data);

    details.set('walletTokens', walletTokens).then(() => {
      callback(data);
      ractive.fire('cancel');
    }).catch((err) => {
      console.error(err);
      ractive.fire('cancel');
    });
  });

  ractive.on('open-qr', () => {
    qrcode.scan(({ address }) => {
      ractive.set('contractAddress', address);
    });
  });

  function handleError(err) {
    ractive.set('isLoading', false);
    showError({ message: err.message });
  }

  return ractive;
}

module.exports = open;
