import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import CS from 'lib/wallet';
import changelly from 'lib/changelly';
import { showError } from 'widgets/modals/flash';
import { translate } from 'lib/i18n';
import _ from 'lodash';
import template from './index.ract';
import footer from '../footer.ract';
import loader from 'partials/loader/loader.ract';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
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
      loader,
      footer,
    },
  });

  let _maxAmount;
  let _fromAmount = '1';

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
      return showError({ message: translate(err.message) });
    });
  });

  ractive.on('back', () => {
    emitter.emit('set-exchange', 'none');
  });

  ractive.on('swap', () => {
    ractive.set('fromSymbol', ractive.get('toSymbol'));
  });

  ractive.on('confirm', () => {
    if (ractive.get('rate') === '?') {
      return showError({
        message: translate('Exchange is currently unavailable for this pair'),
      });
    }

    const fromAmount = parseFloat(ractive.find('#changelly_from_amount').value) || -1;
    const fromSymbol = ractive.get('fromSymbol');
    const minAmount = parseFloat(ractive.get('minAmount')) || 0;
    if (fromAmount < minAmount) {
      const interpolations = { dust: `${ractive.get('minAmount') || 0} ${fromSymbol}` };
      return showError({ message: translate('Please enter an amount above', interpolations) });
    }
    if (_maxAmount && fromAmount > _maxAmount) {
      const interpolations = { max: `${_maxAmount} ${fromSymbol}` };
      return showError({ message: translate('Please enter an amount below', interpolations) });
    }

    const data = {
      fromSymbol,
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
      const fromSymbol = ractive.get('fromSymbol');
      const toSymbol = ractive.get('toSymbol');
      const { minAmount, maxAmount } = await changelly.getPairsParams(fromSymbol, toSymbol);
      _maxAmount = parseFloat(maxAmount) || 0;
      const input = ractive.find('#changelly_from_amount');
      let fromAmount = input.value || -1;
      ractive.set('minAmount', minAmount);
      if ((parseFloat(fromAmount) < parseFloat(minAmount)) && input !== document.activeElement) {
        fromAmount = minAmount;
        input.value = minAmount;
        _fromAmount = minAmount;
      }
      const data = await changelly.estimate(fromSymbol, toSymbol, fromAmount);
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
}
