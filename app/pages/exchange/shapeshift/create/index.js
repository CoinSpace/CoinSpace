'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const { getWallet } = require('lib/wallet');
const denomination = require('lib/denomination');
const { getTokenNetwork } = require('lib/token');
const shapeshift = require('lib/shapeshift');
const qrcode = require('lib/qrcode');
const geo = require('lib/geo');
const showTooltip = require('widgets/modals/tooltip');
const { showError } = require('widgets/modals/flash');
const { showInfo } = require('widgets/modals/flash');
const _ = require('lodash');
const db = require('lib/db');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
      isLogged: shapeshift.isLogged(),
      isLoadingRate: true,
      qrScannerAvailable: qrcode.isScanAvailable,
      isValidating: false,
      fromSymbol: '',
      returnAddress: '',
      toAddress: '',
      toSymbol: '',
      rate: '?',
      coins: [],
      isGeoEnabled(symbol) {
        return Object.keys(geo.networks).indexOf(symbol) !== -1;
      },
    },
    partials: {
      loader: require('../loader.ract'),
      footer: require('../footer.ract'),
    },
  });

  ractive.on('login', () => {
    shapeshift.login().then(() => {
      ractive.set('isLogged', true);
    }).catch((err) => {
      if (err.message === 'user_is_not_verified') {
        return showInfo({
          message: 'Your ShapeShift account is not verified.',
          href: 'https://auth.shapeshift.io',
          linkTextI18n: 'Complete verification',
        });
      }
    });
  });

  ractive.on('logout', () => {
    shapeshift.logout().then(() => {
      ractive.set('isLogged', false);
    });
  });

  const fromSymbolObserver = ractive.observe('fromSymbol', (symbol, old) => {
    if (!old) return;
    if (symbol === ractive.get('toSymbol')) {
      return ractive.set('toSymbol', old);
    }
    return getRate();
  });

  ractive.observe('toSymbol', (symbol, old) => {
    if (!old) return;
    if (symbol === ractive.get('fromSymbol')) {
      return ractive.set('fromSymbol', old);
    }
    return getRate();
  });

  ractive.on('before-show', () => {
    shapeshift.getCoins().then((coins) => {
      ractive.set('isLoading', false);
      ractive.set('coins', coins);

      fromSymbolObserver.silence();
      ractive.set('fromSymbol', denomination(getTokenNetwork()));
      fromSymbolObserver.resume();

      const fromSymbol = ractive.get('fromSymbol');
      if (fromSymbol === ractive.get('toSymbol')) {
        const symbol = getFirstSymbol(coins, fromSymbol);
        ractive.set('toSymbol', symbol);
      } else {
        return getRate();
      }
    }).catch((err) => {
      console.error(err);
      ractive.set('isLoading', false);
      return showError({ message: err.message });
    });
  });

  ractive.on('before-hide', () => {
    ractive.set('isLoading', true);
  });

  ractive.on('back', () => {
    emitter.emit('set-exchange', 'none');
  });

  ractive.on('clearAddress', (context) => {
    const dataContext = context.node.getAttribute('data-context');
    if (dataContext === 'shapeshift-to-address') {
      ractive.set('toAddress', '');
      ractive.find('#shapeshift_to_address').focus();
    } else if (dataContext === 'shapeshift-return-address') {
      ractive.set('returnAddress', '');
      ractive.find('#shapeshift_return_address').focus();
    }
  });

  ractive.on('open-geo', (context) => {
    const dataContext = context.node.getAttribute('data-context');
    const data = {
      overlay: 'geo',
      context: dataContext,
    };

    if (dataContext === 'shapeshift-return-address') {
      data.network = geo.networks[ractive.get('fromSymbol')];
    } else if (dataContext === 'shapeshift-to-address') {
      data.network = geo.networks[ractive.get('toSymbol')];
    }
    emitter.emit('open-overlay', data);
  });

  ractive.on('open-qr', (context) => {
    qrcode.scan({
      context: context.node.getAttribute('data-context'),
    });
  });

  emitter.on('prefill-wallet', (address, context) => {
    if (context === 'shapeshift-return-address') {
      ractive.set('returnAddress', address);
    } else if (context === 'shapeshift-to-address') {
      ractive.set('toAddress', address);
    }
  });

  ractive.on('help', () => {
    showTooltip({
      message: 'Return address should be an address controlled by you where ' +
      'deposit will be returned in the event of a failed transaction.',
    });
  });

  ractive.on('swap', () => {
    ractive.set('fromSymbol', ractive.get('toSymbol'));
    const returnAddress = ractive.get('returnAddress');
    ractive.set('returnAddress', ractive.get('toAddress'));
    ractive.set('toAddress', returnAddress);
  });

  ractive.on('confirm', () => {
    if (ractive.get('rate') === '?') return showError({ message: 'Exchange is currently unavailable for this pair' });
    const options = {
      fromSymbol: ractive.get('fromSymbol'),
      returnAddress: ractive.get('returnAddress').trim(),
      toAddress: ractive.get('toAddress').trim(),
      toSymbol: ractive.get('toSymbol'),
    };
    const fromCoin = _.find(ractive.get('coins'), (item) => {
      return item.symbol === options.fromSymbol;
    });
    return validateAddresses(options).then(() => {
      return shapeshift.shift(options).then((data) => {
        data.depositCoinName = fromCoin ? fromCoin.name : '';
        db.set('shapeshiftInfo', data).then(() => {
          ractive.set('isValidating', false);
          emitter.emit('change-shapeshift-step', 'awaitingDeposit', data);
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
      if (/Please use the precise/.test(err.message)) {
        return showError({ message: 'Exchange is currently unavailable for this pair' });
      }
      if (/Invalid or Expired Authorization Token/.test(err.message)) {
        ractive.set('isLogged', false);
        shapeshift.cleanAccessToken();
        return showError({ message: 'Try to sign in again' });
      }
      console.error(err.message);
      return showError({ message: err.message });
    });
  });

  function validateAddresses(options) {
    ractive.set('isValidating', true);
    const promises = [];
    if (options.returnAddress) {
      promises.push(shapeshift.validateAddress(options.returnAddress, options.fromSymbol));
    } else {
      promises.push(Promise.resolve(true));
    }
    promises.push(shapeshift.validateAddress(options.toAddress, options.toSymbol));

    return Promise.all(promises).then((results) => {
      if (!results[0]) throw new Error('invalid_return_address');
      if (!results[1]) throw new Error('invalid_to_address');
    });
  }

  emitter.on('wallet-ready', setReturnAddress);
  emitter.on('tx-sent', setReturnAddress);
  emitter.on('change-address-type', setReturnAddress);

  function setReturnAddress() {
    if (!ractive.el.classList.contains('current')) {
      return ractive.set('returnAddress', getWallet().getNextAddress());
    }
    if (ractive.get('fromSymbol') === getWallet().denomination) {
      ractive.set('returnAddress', getWallet().getNextAddress());
    }
  }

  function getFirstSymbol(coins, ignoreSymbol) {
    let nextCoin = null;
    coins.some((coin) => {
      if (coin.symbol !== ignoreSymbol) {
        nextCoin = coin;
        return true;
      }
    });
    return nextCoin ? nextCoin.symbol : nextCoin;
  }

  function getRate() {
    ractive.set('isLoadingRate', true);
    return shapeshift.marketInfo(ractive.get('fromSymbol'), ractive.get('toSymbol')).then((data) => {
      const { rate } = data;
      ractive.set('isLoadingRate', false);
      ractive.set('rate', rate);
    }).catch((err) => {
      ractive.set('isLoadingRate', false);
      ractive.set('rate', '?');
      if (/is currently unavailable in your region/.test(err.message)) return;
      console.error(err);
    });
  }

  return ractive;
};
