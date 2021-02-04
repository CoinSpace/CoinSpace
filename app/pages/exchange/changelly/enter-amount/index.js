'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const CS = require('lib/wallet');
const changelly = require('lib/changelly');
const { showError } = require('widgets/modals/flash');
const _ = require('lodash');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
      isLoadingEstimate: true,
      isFirstEstimate: true,
      fromSymbol: '',
      minAmount: '',
      toAmount: '',
      toSymbol: '',
      rate: '',
      coins: [],
    },
    partials: {
      loader: require('partials/loader/loader.ract'),
      footer: require('../footer.ract'),
    },
  });

  const fromSymbolObserver = ractive.observe('fromSymbol', (symbol, old) => {
    if (!old) return;
    if (symbol === ractive.get('toSymbol')) {
      return ractive.set('toSymbol', old);
    }
    return estimate();
  });

  ractive.observe('toSymbol', (symbol, old) => {
    if (!old) return;
    if (symbol === ractive.get('fromSymbol')) {
      return ractive.set('fromSymbol', old);
    }
    return estimate();
  });

  let _fromAmount = '1';
  ractive.on('input-from-amount', () => {
    const fromAmount = ractive.find('#changelly_from_amount').value;
    if (fromAmount === _fromAmount) return;
    _fromAmount = fromAmount;
    estimate();
  });

  ractive.on('before-show', (context) => {
    if (context.isBack) {
      return true;
    }

    ractive.set('isLoading', true);
    ractive.set('isLoadingEstimate', true);
    ractive.set('isFirstEstimate', true);

    changelly.getCoins().then((coins) => {
      ractive.set('isLoading', false);
      ractive.set('coins', coins);

      fromSymbolObserver.silence();
      ractive.set('fromSymbol', CS.getWallet().denomination);
      fromSymbolObserver.resume();

      const fromSymbol = ractive.get('fromSymbol');
      if (fromSymbol === ractive.get('toSymbol')) {
        const symbol = getFirstSymbol(coins, fromSymbol);
        ractive.set('toSymbol', symbol);
      } else {
        return estimate();
      }
    }).catch((err) => {
      ractive.set('isLoading', false);
      return showError({ message: err.message });
    });
  });

  ractive.on('back', () => {
    emitter.emit('set-exchange', 'none');
  });

  ractive.on('swap', () => {
    ractive.set('fromSymbol', ractive.get('toSymbol'));
  });

  ractive.on('confirm', () => {
    if (ractive.get('rate') === '?') return showError({ message: 'Exchange is currently unavailable for this pair' });

    const fromAmount = parseFloat(ractive.find('#changelly_from_amount').value) || -1;
    const minAmount = parseFloat(ractive.get('minAmount')) || 0;
    if (fromAmount < minAmount) {
      const interpolations = { dust: ractive.get('minAmount') || 0 };
      return showError({ message: 'Please enter an amount above', interpolations });
    }

    const data = {
      fromSymbol: ractive.get('fromSymbol'),
      fromAmount: ractive.find('#changelly_from_amount').value,
      toSymbol: ractive.get('toSymbol'),
      networkFee: ractive.get('networkFee'),
    };

    emitter.emit('change-changelly-step', 'create', data);
  });

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

  let _pair = '';
  function estimate() {
    ractive.set('isLoadingEstimate', true);
    ractive.set('toAmount', '...');
    const pair = ractive.get('fromSymbol') + '_' + ractive.get('toSymbol');
    if (pair !== _pair) {
      ractive.set('isFirstEstimate', true);
      _pair = pair;
    }
    debounceEstimate();
  }

  const debounceEstimate = _.debounce(async () => {
    if (!ractive.el.classList.contains('current')) return;
    try {
      const { minAmount } = await changelly.getMinAmount(ractive.get('fromSymbol'), ractive.get('toSymbol'));
      const input = ractive.find('#changelly_from_amount');
      let fromAmount = input.value || -1;
      ractive.set('minAmount', minAmount);
      if ((parseFloat(fromAmount) < parseFloat(minAmount)) && input !== document.activeElement) {
        fromAmount = minAmount;
        input.value = minAmount;
        _fromAmount = minAmount;
      }
      const data = await changelly.estimate(ractive.get('fromSymbol'), ractive.get('toSymbol'), fromAmount);
      ractive.set('rate', data.rate);
      ractive.set('toAmount', data.result);
      ractive.set('networkFee', data.networkFee);
      ractive.set('isLoadingEstimate', false);
      ractive.set('isFirstEstimate', false);
    } catch (err) {
      ractive.set('rate', '?');
      ractive.set('toAmount', '?');
      ractive.set('minAmount', '?');
      ractive.set('networkFee', '?');
      ractive.set('isLoadingEstimate', false);
      ractive.set('isFirstEstimate', false);
      console.error(err);
    }
  }, 500);

  return ractive;
};
