'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var denomination = require('lib/denomination');
var getTokenNetwork = require('lib/token').getTokenNetwork;
var changelly = require('lib/changelly');
var showError = require('widgets/modals/flash').showError;
var _ = require('lodash');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
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
      coins: []
    },
    partials: {
      loader: require('../loader.ract'),
      footer: require('../footer.ract')
    }
  });

  var fromSymbolObserver = ractive.observe('fromSymbol', function(symbol, old) {
    if (!old) return;
    if (symbol === ractive.get('toSymbol')) {
      return ractive.set('toSymbol', old);
    }
    return estimate();
  });

  ractive.observe('toSymbol', function(symbol, old) {
    if (!old) return;
    if (symbol === ractive.get('fromSymbol')) {
      return ractive.set('fromSymbol', old);
    }
    return estimate();
  });

  var _fromAmount = '1';
  ractive.on('input-from-amount', function() {
    var fromAmount = ractive.find('#changelly_from_amount').value;
    if (fromAmount === _fromAmount) return;
    _fromAmount = fromAmount;
    estimate();
  });

  ractive.on('before-show', function(context) {
    if (context.isBack) {
      return true;
    }

    ractive.set('isLoading', true);
    ractive.set('isLoadingEstimate', true);
    ractive.set('isFirstEstimate', true);

    changelly.getCoins().then(function(coins) {
      ractive.set('isLoading', false);
      ractive.set('coins', coins);

      fromSymbolObserver.silence();
      ractive.set('fromSymbol', denomination(getTokenNetwork()));
      fromSymbolObserver.resume();

      var fromSymbol = ractive.get('fromSymbol');
      if (fromSymbol === ractive.get('toSymbol')) {
        var symbol = getFirstSymbol(coins, fromSymbol);
        ractive.set('toSymbol', symbol);
      } else {
        return estimate();
      }
    }).catch(function(err) {
      console.error(err);
      return showError({message: err.message});
    });
  });

  ractive.on('back', function() {
    emitter.emit('set-exchange', 'none');
  });

  ractive.on('swap', function() {
    ractive.set('fromSymbol', ractive.get('toSymbol'));
  });

  ractive.on('confirm', function() {
    if (ractive.get('rate') === '?') return showError({message: 'Exchange is currently unavailable for this pair'});

    var fromAmount = parseFloat(ractive.find('#changelly_from_amount').value) || -1;
    var minAmount = parseFloat(ractive.get('minAmount')) || 0;
    if (fromAmount < minAmount) {
      var interpolations = {dust: ractive.get('minAmount') || 0};
      return showError({message: 'Please enter an amount above', interpolations: interpolations});
    }

    var data = {
      fromSymbol: ractive.get('fromSymbol'),
      fromAmount: ractive.find('#changelly_from_amount').value,
      toSymbol: ractive.get('toSymbol'),
      networkFee: ractive.get('networkFee')
    };

    emitter.emit('change-changelly-step', 'create', data);
  });

  function getFirstSymbol(coins, ignoreSymbol) {
    var nextCoin = null;
    coins.some(function(coin) {
      if (coin.symbol !== ignoreSymbol) {
        nextCoin = coin;
        return true;
      }
    });
    return nextCoin ? nextCoin.symbol : nextCoin;
  }

  var _pair = '';
  function estimate() {
    ractive.set('isLoadingEstimate', true);
    ractive.set('toAmount', '...');
    var pair = ractive.get('fromSymbol') + '_' + ractive.get('toSymbol');
    if (pair !== _pair) {
      ractive.set('isFirstEstimate', true);
      _pair = pair
    }
    debounceEstimate();
  }

  var debounceEstimate = _.debounce(function() {
    if (!ractive.el.classList.contains('current')) return;
    var fromAmount = ractive.find('#changelly_from_amount').value;
    changelly.estimate(ractive.get('fromSymbol'), ractive.get('toSymbol'), fromAmount).then(function(data) {
      ractive.set('rate', data.rate);
      ractive.set('toAmount', data.result);
      ractive.set('minAmount', data.minAmount);
      ractive.set('networkFee', data.networkFee);
      ractive.set('isLoadingEstimate', false);
      ractive.set('isFirstEstimate', false);
    }).catch(function(err) {
      ractive.set('rate', '?');
      ractive.set('toAmount', '?');
      ractive.set('minAmount', '?');
      ractive.set('networkFee', '?');
      ractive.set('isLoadingEstimate', false);
      ractive.set('isFirstEstimate', false);
      console.error(err);
    });
  }, 500);

  return ractive;
}
