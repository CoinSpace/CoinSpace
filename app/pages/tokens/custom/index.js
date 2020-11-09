'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const { showError } = require('widgets/modals/flash');
const qrcode = require('lib/qrcode');
const details = require('lib/wallet/details');
const tokens = require('lib/tokens');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      qrScannerAvailable: qrcode.isScanAvailable,
      address: '',
      symbol: '',
      decimals: '',
    },
  });

  ractive.on('clearAddress', () => {
    ractive.set('address', '');
    ractive.find('#contract_address').focus();
  });

  ractive.on('addToken', async () => {
    const walletTokens = details.get('tokens');
    const token = {
      _id: ractive.get('_id'),
      address: ractive.get('address').trim(),
      symbol: ractive.get('symbol').trim(),
      name: ractive.get('name') || ractive.get('symbol').trim(),
      decimals: ractive.get('decimals'),
      icon: ractive.get('icon'),
      network: 'ethereum',
    };

    if (!token.address || !token.symbol || typeof token.decimals !== 'number') {
      return showError({ message: 'Please fill out all fields.' });
    }

    walletTokens.push(token);

    details.set('tokens', walletTokens)
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        emitter.emit('set-tokens', 'list');
      });
  });

  ractive.on('inputAddress', () => {
    const token = tokens.getTokenByAddress(ractive.get('address'));
    if (token) {
      ractive.set('_id', token._id);
      ractive.set('symbol', token.symbol);
      ractive.set('name', token.name);
      ractive.set('decimals', token.decimals);
      ractive.set('icon', token.icon);
    }
  });

  ractive.on('open-qr', () => {
    qrcode.scan(({ address }) => {
      ractive.set('address', address);
    });
  });

  ractive.on('back', () => {
    emitter.emit('set-tokens', 'search');
  });

  return ractive;
};
