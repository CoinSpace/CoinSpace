'use strict';

const Ractive = require('widgets/modals/base');
const { showError } = require('widgets/modals/flash');
const qrcode = require('lib/qrcode');
const details = require('lib/wallet/details');
const tokens = require('lib/tokens');

function open(callback) {

  const walletTokens = details.get('tokens');
  const ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
    },
    data: {
      isLoading: false,
      qrScannerAvailable: qrcode.isScanAvailable,
      contractAddress: '',
      symbol: '',
      decimals: '',
      tokens: [],
      token: '-1',
      isInited: false,
    },
  });

  tokens.getTokens()
    .then((ethereumTokens) => {
      ractive.set({
        tokens: ethereumTokens,
        isInited: true,
      });
    }).catch(console.error);

  ractive.on('clearContractAddress', () => {
    const input = ractive.find('#contract_address');
    ractive.set('contractAddress', '');
    input.focus();
  });

  ractive.on('add', async () => {
    ractive.set('isLoading', true);

    const token = ractive.get('token');
    const data = token ? await tokens.getTokenById(token._id) : {
      address: ractive.get('contractAddress').trim(),
      symbol: ractive.get('symbol').trim(),
      name: ractive.get('symbol').trim(),
      decimals: ractive.get('decimals'),
      network: 'ethereum',
    };

    if (!data.address || !data.symbol || typeof data.decimals !== 'number') {
      return handleError(new Error('Please fill out all fields.'));
    }

    walletTokens.push(data);

    details.set('tokens', walletTokens).then(() => {
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
