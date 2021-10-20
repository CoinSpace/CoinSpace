import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import { getWallet } from 'lib/wallet';
import crypto from 'lib/crypto';
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
      fromCryptoId: null,
      minAmount: '',
      toAmount: '',
      toCryptoId: null,
      rate: '',
      coins: [],
    },
    computed: {
      fromCrypto: {
        get() {
          return this.get('coins').find((item) => item._id === this.get('fromCryptoId'));
        },
      },
      toCrypto: {
        get() {
          return this.get('coins').find((item) => item._id === this.get('toCryptoId'));
        },
      },
    },
    partials: {
      loader,
      footer,
    },
  });

  let _maxAmount;
  let _fromAmount = '1';

  const fromCryptoIdObserver = ractive.observe('fromCryptoId', (id, old) => {
    if (!old) return;
    if (id === ractive.get('toCryptoId')) {
      return ractive.set('toCryptoId', old);
    }
    return estimate();
  });

  ractive.observe('toCryptoId', (id, old) => {
    if (!old) return;
    if (id === ractive.get('fromCryptoId')) {
      return ractive.set('fromCryptoId', old);
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

    crypto.getCryptos().then((cryptos) => {
      const coins = cryptos.filter((item) => item.changelly);
      ractive.set('isLoading', false);
      ractive.set('coins', coins);

      fromCryptoIdObserver.silence();
      const { crypto } = getWallet();
      const coin = coins.find((coin) => coin._id === crypto._id);
      ractive.set('fromCryptoId', coin ? coin._id : getFirstCryptoId(coins));
      fromCryptoIdObserver.resume();

      const fromCryptoId = ractive.get('fromCryptoId');
      if (!ractive.get('toCryptoId') || fromCryptoId === ractive.get('toCryptoId')) {
        ractive.set('toCryptoId', getFirstCryptoId(coins, fromCryptoId));
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
    ractive.set('fromCryptoId', ractive.get('toCryptoId'));
  });

  ractive.on('confirm', () => {
    if (ractive.get('rate') === '?') {
      return showError({
        message: translate('Exchange is currently unavailable for this pair'),
      });
    }

    const fromAmount = parseFloat(ractive.find('#changelly_from_amount').value) || -1;
    const fromCrypto = ractive.get('fromCrypto');
    const toCrypto = ractive.get('toCrypto');
    const minAmount = parseFloat(ractive.get('minAmount')) || 0;
    if (fromAmount < minAmount) {
      const interpolations = { dust: `${ractive.get('minAmount') || 0} ${fromCrypto.symbol}` };
      return showError({ message: translate('Please enter an amount above', interpolations) });
    }
    if (_maxAmount && fromAmount > _maxAmount) {
      const interpolations = { max: `${_maxAmount} ${fromCrypto.symbol}` };
      return showError({ message: translate('Please enter an amount below', interpolations) });
    }

    const data = {
      fromCrypto,
      fromAmount: ractive.find('#changelly_from_amount').value,
      toCrypto,
      networkFee: ractive.get('networkFee'),
      coins: ractive.get('coins'),
    };

    emitter.emit('change-changelly-step', 'create', data);
  });

  function getFirstCryptoId(coins, ignoreId) {
    for (const coin of coins) {
      if (coin._id !== ignoreId) {
        return coin._id;
      }
    }
  }

  let _pair = '';
  function estimate() {
    ractive.set('isLoadingEstimate', true);
    ractive.set('toAmount', '...');
    const pair = ractive.get('fromCryptoId') + '_' + ractive.get('toCryptoId');
    if (pair !== _pair) {
      ractive.set('isFirstEstimate', true);
      _pair = pair;
    }
    debounceEstimate();
  }

  const debounceEstimate = _.debounce(async () => {
    if (!ractive.el.classList.contains('current')) return;
    try {
      const fromCrypto = ractive.get('fromCrypto');
      const toCrypto = ractive.get('toCrypto');
      const { minAmount, maxAmount } = await changelly.getPairsParams(
        fromCrypto.changelly.ticker,
        toCrypto.changelly.ticker
      );
      _maxAmount = parseFloat(maxAmount) || 0;
      const input = ractive.find('#changelly_from_amount');
      let fromAmount = input.value || -1;
      ractive.set('minAmount', minAmount);
      if ((parseFloat(fromAmount) < parseFloat(minAmount)) && input !== document.activeElement) {
        fromAmount = minAmount;
        input.value = minAmount;
        _fromAmount = minAmount;
      }
      const data = await changelly.estimate(
        fromCrypto.changelly.ticker,
        toCrypto.changelly.ticker,
        fromAmount
      );
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
