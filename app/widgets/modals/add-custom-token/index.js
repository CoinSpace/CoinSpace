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
      isValidating: false,
    },
  });

  ractive.on('clearAddress', () => {
    ractive.set('address', '');
    ractive.find('#contract_address').focus();
  });

  ractive.on('addToken', async () => {
    ractive.set('isValidating', true);
    const walletTokens = details.get('tokens');
    const address = ractive.get('address').trim().toLowerCase();
    let token;

    if (!address) {
      ractive.set('isValidating', false);
      return showError({ message: 'Please fill out address.' });
    }

    token = tokens.getTokenByAddress(address);

    if (!token) {
      token = await tokens.requestTokenByAddress(address).catch((err) => {
        if (err.status === 400 || err.status === 404) {
          showError({
            message: 'address is not a valid address.',
            interpolations: {
              address,
            },
          });
        }
        console.error(err);
      });
    }

    if (!token) {
      ractive.set('isValidating', false);
      return;
    }

    if ((token._id && walletTokens.map(item => item._id).includes(token._id))
        || walletTokens.map(item => item.address).includes(token.address)) {
      ractive.set('isValidating', false);
      return showError({ message: 'This Token has already been added.' });
    }

    walletTokens.push(token);
    details.set('tokens', walletTokens)
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        ractive.set('isValidating', false);
        ractive.fire('cancel');
        emitter.emit('set-tokens', 'list');
        emitter.emit('token-added', token);
      });
  });

  ractive.on('openQr', () => {
    qrcode.scan(({ address }) => {
      ractive.set('address', address);
    });
  });

  return ractive;
}

module.exports = open;
