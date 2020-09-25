'use strict';

const Ractive = require('widgets/modals/base');
const { showError } = require('widgets/modals/flash');
const qrcode = require('lib/qrcode');
const showConfirmation = require('widgets/modals/confirm-send');
const { showInfo } = require('widgets/modals/flash');
const { getWallet } = require('lib/wallet');
const { setToAlias } = require('lib/wallet');
const { toUnitString } = require('lib/convert');
const { getTokenNetwork } = require('lib/token');
const _ = require('lodash');

let ractive;

function open() {

  ractive = new Ractive({
    partials: {
      content: require('./_content.ract'),
    },
    data: {
      isLoading: false,
      qrScannerAvailable: qrcode.isScanAvailable,
    },
  });

  ractive.on('clearPrivateKey', () => {
    const input = ractive.find('#private_key');
    ractive.set('privateKey', '');
    input.focus();
  });

  ractive.on('transfer', () => {
    ractive.set('isLoading', true);
    const wallet = getWallet();
    const to = wallet.getNextAddress();
    let privateKey;
    try {
      privateKey = wallet.createPrivateKey(ractive.get('privateKey'));
    } catch (err) {
      return handleError(new Error('Invalid private key'));
    }
    wallet.getImportTxOptions(privateKey).then((importTxOptions) => {
      if (parseFloat(importTxOptions.amount) === 0) {
        ractive.set('isLoading', false);
        return showInfo({ message: 'This private key has no coins for transfer.' });
      }
      importTxOptions.to = to;
      setToAlias(importTxOptions);

      showConfirmation({
        to: importTxOptions.to,
        alias: importTxOptions.alias,
        amount: toUnitString(importTxOptions.amount),
        denomination: wallet.denomination,
        fadeInDuration: 0,
        importTxOptions,
      });

    }).catch(handleError);
  });

  ractive.on('open-qr', () => {
    qrcode.scan(({ address }) => {
      if (address) ractive.set('privateKey', address);
    });
  });

  function handleError(err) {
    ractive.set('isLoading', false);
    if (/^Private key equal wallet private key/.test(err.message)) {
      return showError({ message: 'Please enter a private key other than your wallet private key' });
    } else if (err.message === 'cs-node-error') {
      return showError({
        message: 'Network node error. Please try again later.',
        interpolations: { network: _.upperFirst(getTokenNetwork()) },
      });
    }
    return showError({ message: err.message });
  }

  return ractive;
}

module.exports = open;
