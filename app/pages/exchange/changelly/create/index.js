'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const { getWallet } = require('lib/wallet');
const changelly = require('lib/changelly');
const qrcode = require('lib/qrcode');
const geo = require('lib/geo');
const showTooltip = require('widgets/modals/tooltip');
const { showError } = require('widgets/modals/flash');
const details = require('lib/wallet/details');
const showMecto = require('widgets/modals/mecto');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      qrScannerAvailable: qrcode.isScanAvailable,
      isValidating: false,
      fromSymbol: '',
      returnAddress: '',
      toAddress: '',
      toSymbol: '',
      isGeoEnabled(symbol) {
        return Object.keys(geo.networks).indexOf(symbol) !== -1;
      },
    },
    partials: {
      loader: require('../loader.ract'),
      footer: require('../footer.ract'),
    },
  });

  ractive.on('before-show', (context) => {
    ractive.set('fromAmount', context.fromAmount);
    ractive.set('fromSymbol', context.fromSymbol);
    ractive.set('toSymbol', context.toSymbol);
    ractive.set('networkFee', context.networkFee);

    const wallet = getWallet();
    if (wallet) {
      ractive.set('returnAddress', context.fromSymbol === wallet.denomination ? wallet.getNextAddress() : '');
      ractive.set('toAddress', context.toSymbol === wallet.denomination ? wallet.getNextAddress() : '');
    }
  });

  ractive.on('back', () => {
    emitter.emit('change-changelly-step', 'enterAmount', { isBack: true });
  });

  ractive.on('clearAddress', (context) => {
    const dataContext = context.node.getAttribute('data-context');
    if (dataContext === 'changelly-to-address') {
      ractive.set('toAddress', '');
      ractive.find('#changelly_to_address').focus();
    } else if (dataContext === 'changelly-return-address') {
      ractive.set('returnAddress', '');
      ractive.find('#changelly_return_address').focus();
    }
  });

  ractive.on('open-geo', (context) => {
    const dataContext = context.node.getAttribute('data-context');
    if (dataContext === 'changelly-return-address') {
      showMecto(geo.networks[ractive.get('fromSymbol')], (address) => {
        ractive.set('returnAddress', address);
      });
    } else if (dataContext === 'changelly-to-address') {
      showMecto(geo.networks[ractive.get('toSymbol')], (address) => {
        ractive.set('toAddress', address);
      });
    }
  });

  ractive.on('open-qr', (context) => {
    context = context.node.getAttribute('data-context');
    if (context === 'changelly-return-address') {
      qrcode.scan(({ address }) => {
        if (address) ractive.set('returnAddress', address);
      });
    } else if (context === 'changelly-to-address') {
      qrcode.scan(({ address }) => {
        if (address) ractive.set('toAddress', address);
      });
    }
  });

  ractive.on('help', () => {
    showTooltip({
      message: 'Return address should be an address controlled by you where ' +
      'deposit will be returned in the event of a failed transaction.',
    });
  });

  ractive.on('confirm', () => {
    const options = {
      fromSymbol: ractive.get('fromSymbol'),
      returnAddress: ractive.get('returnAddress').trim(),
      toAddress: ractive.get('toAddress').trim(),
      toSymbol: ractive.get('toSymbol'),
      fromAmount: ractive.get('fromAmount'),
    };
    return validateAddresses(options).then(() => {
      return changelly.createTransaction(options).then((data) => {
        data.networkFee = ractive.get('networkFee');
        details.set('changellyInfo', data).then(() => {
          ractive.set('isValidating', false);
          emitter.emit('change-changelly-step', 'awaitingDeposit', data);
        }).catch((err) => {
          ractive.set('isValidating', false);
          console.error(err);
        });
      });
    }).catch((err) => {
      ractive.set('isValidating', false);
      if (err.message === 'invalid_return_address') {
        return showError({ message: 'Please enter a valid return address' });
      }
      if (err.message === 'invalid_to_address') {
        return showError({ message: 'Please enter a valid address to send to' });
      }
      if (err.message === 'exchange_error') {
        return showError({ message: 'Exchange error' });
      }
      console.error(err.message);
      return showError({ message: err.message });
    });
  });

  function validateAddresses(options) {
    ractive.set('isValidating', true);
    const promises = [];
    if (options.returnAddress) {
      promises.push(changelly.validateAddress(options.returnAddress, options.fromSymbol));
    } else {
      promises.push(Promise.resolve(true));
    }
    promises.push(changelly.validateAddress(options.toAddress, options.toSymbol));

    return Promise.all(promises).then((results) => {
      if (!results[0]) throw new Error('invalid_return_address');
      if (!results[1]) throw new Error('invalid_to_address');
    });
  }

  return ractive;
};
