import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import { getWallet, getWalletById } from 'lib/wallet';
import crypto from 'lib/crypto';
import changelly from 'lib/changelly';
import { showError } from 'widgets/modals/flash';
import details from 'lib/wallet/details';
import showMecto from 'widgets/modals/mecto';
import qrcode from 'lib/qrcode';
import { validateSend } from 'lib/wallet/validator';
import showConfirmation from 'widgets/modals/confirm-send';
import { toAtom, toUnitString } from 'lib/convert';
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
      fromCrypto: null,
      minAmount: '',
      toCryptoId: null,
      toCrypto: null,
      toAmount: '',
      toAddress: '',
      toCryptoSupported: false,
      usedOwnToAddress: false,
      rate: '',
      coins: [],
      qrScannerAvailable: qrcode.isScanAvailable,
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
    ractive.set('fromCrypto', ractive.get('coins').find((item) => item._id === id));
    if (id === ractive.get('toCryptoId')) {
      return ractive.set('toCryptoId', old);
    }
    return estimate();
  });

  ractive.observe('toCryptoId', (id, old) => {
    if (!old) return;
    const toCrypto = ractive.get('coins').find((item) => item._id === id);
    ractive.set('toCrypto', toCrypto);
    ractive.set('toCryptoSupported', toCrypto.supported && !!getWalletById(toCrypto._id));
    if (ractive.get('toCryptoSupported')) {
      ractive.set('toAddress', getWalletById(toCrypto._id).getNextAddress());
      ractive.set('usedOwnToAddress', true);
    } else {
      ractive.set('toAddress', '');
      ractive.set('usedOwnToAddress', false);
    }
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
      const fromCrypto = coins.find((coin) => coin._id === crypto._id) || getFirstCrypto(coins);
      ractive.set('fromCryptoId', fromCrypto._id);
      ractive.set('fromCrypto', fromCrypto);
      fromCryptoIdObserver.resume();

      if (!ractive.get('toCrypto') || fromCrypto._id === ractive.get('toCryptoId')) {
        const toCrypto = getFirstCrypto(coins, fromCrypto._id);
        ractive.set('toCryptoId', toCrypto._id);
        ractive.set('toCrypto', toCrypto);
        ractive.set('toCryptoSupported', toCrypto.supported && !!getWalletById(toCrypto._id));
        if (ractive.get('toCryptoSupported')) {
          ractive.set('toAddress', getWalletById(toCrypto._id).getNextAddress());
          ractive.set('usedOwnToAddress', true);
        } else {
          ractive.set('toAddress', '');
          ractive.set('usedOwnToAddress', false);
        }
        return estimate();
      } else {
        return estimate();
      }
    }).catch((err) => {
      ractive.set('isLoading', false);
      return showError({ message: translate(err.message) });
    });
  });

  ractive.on('open-geo', (context) => {
    const dataContext = context.node.getAttribute('data-context');
    if (dataContext === 'changelly-to-address') {
      showMecto((address) => {
        ractive.set('toAddress', address);
      });
    }
  });

  ractive.on('open-qr', (context) => {
    context = context.node.getAttribute('data-context');
    if (context === 'changelly-to-address') {
      qrcode.scan(({ address }) => {
        if (address) ractive.set('toAddress', address);
      });
    }
  });

  ractive.on('use-own-to-address', () => {
    if (ractive.get('toCryptoSupported')) {
      ractive.set('toAddress', getWalletById(ractive.get('toCrypto')._id).getNextAddress());
      ractive.set('usedOwnToAddress', true);
    }
  });

  ractive.on('use-custom-to-address', () => {
    ractive.set('toAddress', '');
    ractive.set('usedOwnToAddress', false);
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

    const options = {
      toSymbol: toCrypto.changelly.ticker,
      fromSymbol: fromCrypto.changelly.ticker,
      toAddress: ractive.get('toAddress').trim(),
      returnAddress: fromCrypto.supported
        && !!getWalletById(fromCrypto._id)
        && getWalletById(fromCrypto._id).getNextAddress(),
      fromAmount,
    };
    return validateAddresses(options).then(() => {
      return changelly.createTransaction(options).then(async (data) => {
        data.networkFee = ractive.get('networkFee');
        data.depositBlockchain = ractive.get('fromCrypto').platformName;
        data.toBlockchain = ractive.get('toCrypto').platformName;

        const wallet = getWallet();
        data.internalExchange = wallet.crypto._id === ractive.get('fromCrypto')._id;

        if (data.internalExchange) {
          let fee;
          if (['bitcoin', 'bitcoin-cash', 'bitcoin-sv', 'litecoin', 'dogecoin', 'dash', 'monero']
            .includes(wallet.crypto.platform)) {
            fee = toUnitString(wallet.estimateFees(toAtom(data.depositAmount)).find((item) => item.default).estimate);
          } else if (['ripple', 'stellar', 'eos', 'ethereum', 'binance-smart-chain']
            .includes(wallet.crypto.platform)) {
            fee = toUnitString(wallet.defaultFee);
          }
          let destinationInfo;
          if (wallet.crypto._id === 'stellar@stellar') {
            destinationInfo = await wallet.getDestinationInfo(data.depositAddress);
          }
          const options = {
            wallet,
            to: data.depositAddress,
            //alias
            fee,
            //feeName
            destinationInfo,
            amount: data.depositAmount,
            symbol: wallet.crypto.symbol,
            onSuccessDismiss() {
              // TODO add tx id to data
              emitter.emit('change-changelly-step', 'awaitingDeposit', data);
            },
          };
          if (wallet.crypto.platform === 'ripple') {
            options.tag = data.extraId;
          } else if (wallet.crypto.platform === 'stellar') {
            options.memo = data.extraId;
          } else if (wallet.crypto.platform === 'eos') {
            options.memo = data.extraId;
          }
          try {
            await validateSend(options);
          } catch {
            return;
          }
          showConfirmation(options);
        }

        await details.set('changellyInfo', data).then(() => {
          ractive.set('isValidating', false);
          if (data.internalExchange) {
            emitter.emit('change-changelly-step', 'awaiting', data);
          } else {
            emitter.emit('change-changelly-step', 'awaitingDeposit', data);
          }
        }).catch((err) => {
          ractive.set('isValidating', false);
          console.error(err);
        });
      });
    }).catch((err) => {
      ractive.set('isValidating', false);
      if (err.message === 'invalid_return_address') {
        return showError({ message: translate('Please enter a valid return address') });
      }
      if (err.message === 'invalid_to_address') {
        return showError({ message: translate('Please enter a valid address to send to') });
      }
      if (err.message === 'exchange_error') {
        return showError({ message: translate('Exchange error') });
      }
      console.error(`not translated error: ${err.message}`);
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

  function getFirstCrypto(coins, ignoreId) {
    for (const coin of coins) {
      if (coin._id !== ignoreId) {
        return coin;
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
