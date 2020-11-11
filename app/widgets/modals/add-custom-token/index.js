'use strict';

const Ractive = require('widgets/modals/base');
const emitter = require('lib/emitter');
const { showError } = require('widgets/modals/flash');
const qrcode = require('lib/qrcode');
const details = require('lib/wallet/details');
const tokens = require('lib/tokens');

function open() {

  const ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
    },
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
      address: ractive.get('address').trim().toLowerCase(),
      symbol: ractive.get('symbol').trim(),
      name: ractive.get('name') || ractive.get('symbol').trim(),
      decimals: ractive.get('decimals'),
      icon: ractive.get('icon'),
      network: 'ethereum',
    };

    if (!token.address || !token.symbol || typeof token.decimals !== 'number') {
      return showError({ message: 'Please fill out all fields.' });
    }

    if (token._id) {
      const walletTokenIds = details.get('tokens').map(item => item._id);
      if (walletTokenIds.includes(token._id)) {
        return showError({ message: 'This Token has already been added.' });
      }
    }

    walletTokens.push(token);

    details.set('tokens', walletTokens)
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        ractive.fire('cancel');
        emitter.emit('set-tokens', 'list');
      });
  });

  ractive.on('inputAddress', () => {
    const token = tokens.getTokenByAddress(ractive.get('address').toLowerCase());
    if (token) {
      ractive.set('_id', token._id);
      ractive.set('symbol', token.symbol);
      ractive.set('name', token.name);
      ractive.set('decimals', token.decimals);
      ractive.set('icon', token.icon);
    } else {
      ractive.set('_id', null);
      ractive.set('name', null);
      ractive.set('icon', null);
    }
  });

  ractive.on('openQr', () => {
    qrcode.scan(({ address }) => {
      ractive.set('address', address);
    });
  });

  return ractive;
}

module.exports = open;
