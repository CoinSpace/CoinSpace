import Ractive from '../ractive';
import emitter from 'lib/emitter';
import { getWallet, getWalletById, walletCoins } from 'lib/wallet';

import crypto from 'lib/crypto';
import changelly from 'lib/changelly';
import { showError } from 'widgets/modals/flash';
import details from 'lib/wallet/details';
import showMecto from 'widgets/modals/mecto';
import qrcode from 'lib/qrcode';
import { validateSend } from 'lib/wallet/validator';
import showConfirmation from 'widgets/modals/confirm-send';
import { getAddressWithAlias } from 'lib/domain';
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
      isConfirming: false,
      isFirstEstimate: true,
      fromCrypto: null,
      minAmount: '',
      toCrypto: null,
      toAmount: '',
      toAddress: '',
      hasWalletAddress: false,
      useWalletAddress: true,
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
  let _pair = '';
  let prevFromCryptoId;
  let prevToCryptoId;
  let coins;

  ractive.on('input-from-amount', () => {
    const fromAmount = ractive.find('#changelly_from_amount').value;
    if (fromAmount === _fromAmount) return;
    _fromAmount = fromAmount;
    estimate();
  });

  ractive.on('change-from', () => {
    setFromCrypto(ractive.get('fromCrypto'));
    estimate();
  });

  ractive.on('change-to', () => {
    setToCrypto(ractive.get('toCrypto'));
    estimate();
  });

  ractive.on('before-show', async (context) => {
    if (context.isBack) {
      return true;
    }
    ractive.set('isLoading', true);
    ractive.set('isFirstEstimate', true);
    prevFromCryptoId = undefined;
    prevToCryptoId = undefined;

    await setCoins();

    const wallet = getWallet();
    const fromCrypto = coins.find((coin) => coin._id === wallet.crypto._id) || getFirstCrypto();
    const toCrypto = getFirstCrypto(fromCrypto._id);

    setFromCrypto(fromCrypto);
    setToCrypto(toCrypto);
    estimate();
  });

  ractive.on('open-geo', () => {
    showMecto((address) => {
      ractive.set('toAddress', address);
    });
  });

  ractive.on('open-qr', () => {
    qrcode.scan(({ address }) => {
      if (address) ractive.set('toAddress', address);
    });
  });

  ractive.on('clear-to-address', () => {
    ractive.set('toAddress', '');
    ractive.find('#changelly_to_address').focus();
  });

  ractive.on('use-wallet-address', () => {
    ractive.set('useWalletAddress', true);
  });

  ractive.on('use-custom-address', () => {
    ractive.set('toAddress', '');
    ractive.set('useWalletAddress', false);
  });

  ractive.on('back', () => {
    emitter.emit('set-exchange', 'none');
  });

  ractive.on('swap', () => {
    setFromCrypto(ractive.get('toCrypto'));
    estimate();
  });

  ractive.on('confirm', async () => {
    if (ractive.get('rate') === '?') {
      return showError({
        message: translate('Exchange is currently unavailable for this pair'),
      });
    }

    const fromAmount = parseFloat(ractive.find('#changelly_from_amount').value) || -1;
    const fromCrypto = ractive.get('fromCrypto');
    const toCrypto = ractive.get('toCrypto');
    const toWallet = getWalletById(toCrypto._id);
    const minAmount = parseFloat(ractive.get('minAmount')) || 0;
    if (fromAmount < minAmount) {
      const interpolations = { dust: `${ractive.get('minAmount') || 0} ${fromCrypto.symbol}` };
      return showError({ message: translate('Please enter an amount above', interpolations) });
    }
    if (_maxAmount && fromAmount > _maxAmount) {
      const interpolations = { max: `${_maxAmount} ${fromCrypto.symbol}` };
      return showError({ message: translate('Please enter an amount below', interpolations) });
    }

    let toAddress;
    if (ractive.get('hasWalletAddress') && ractive.get('useWalletAddress')) {
      toAddress = toWallet.getNextAddress();
    } else {
      toAddress = ractive.get('toAddress').trim();
    }
    const fromWallet = getWalletById(fromCrypto._id);
    const refundAddress = (fromWallet && fromCrypto.supported) ? fromWallet.getNextAddress() : null;
    const options = {
      toCrypto,
      fromCrypto,
      refundAddress,
      fromAmount,
    };

    try {
      ractive.set('isConfirming', true);

      const { address } = await getAddressWithAlias(toCrypto, toAddress);
      options.toAddress = address;

      await validateAddresses(options);
      const data = await changelly.createTransaction(options);

      data.toAddress = address;
      data.fromCryptoId = fromCrypto._id;
      data.toCryptoId = toCrypto._id;
      const wallet = getWallet();
      data.internalExchange = wallet.crypto._id === fromCrypto._id;
      if (data.internalExchange) {
        await internalExchange(wallet, data);
        ractive.set('isConfirming', false);
      } else {
        try {
          await details.set('changellyInfo', data);
          emitter.emit('change-changelly-step', 'awaitingDeposit', data);
        } catch (err) {
          console.error(err);
        }
      }
    } catch (err) {
      if (err.message === 'invalid_return_address') {
        showError({ message: translate('Please enter a valid return address') });
      } else if (err.message === 'invalid_to_address') {
        showError({ message: translate('Please enter a valid address to send to') });
      } else if (err.message === 'exchange_error') {
        showError({ message: translate('Exchange error') });
      } else {
        console.error(`not translated error: ${err.message}`);
        showError({ message: err.message });
      }
    }
    ractive.set('isConfirming', false);
  });

  async function validateAddresses(options) {
    const promises = [];
    if (options.refundAddress) {
      promises.push(changelly.validateAddress(options.refundAddress, options.fromCrypto._id));
    } else {
      promises.push(true);
    }
    promises.push(changelly.validateAddress(options.toAddress, options.toCrypto._id));

    return Promise.all(promises).then((results) => {
      if (!results[0]) throw new Error('invalid_return_address');
      if (!results[1]) throw new Error('invalid_to_address');
    });
  }

  async function internalExchange(wallet, data) {
    let fee;
    if (['bitcoin', 'bitcoin-cash', 'bitcoin-sv', 'litecoin', 'dogecoin', 'dash', 'monero', 'cardano']
      .includes(wallet.crypto.platform)) {
      fee = toUnitString(wallet.estimateFees(toAtom(data.depositAmount)).find((item) => item.default).estimate);
    } else if (['ripple', 'stellar', 'eos']
      .includes(wallet.crypto.platform)) {
      fee = toUnitString(wallet.defaultFee);
    } else if (['ethereum', 'binance-smart-chain', 'ethereum-classic']
      .includes(wallet.crypto.platform)) {
      fee = toUnitString(wallet.defaultFee, 18);
    }
    let destinationInfo;
    if (wallet.crypto._id === 'stellar@stellar') {
      destinationInfo = await wallet.getDestinationInfo(data.depositAddress);
    }
    let to = data.depositAddress;
    if (wallet.crypto._id === 'bitcoin-cash@bitcoin-cash') {
      to = wallet.toLegacyAddress(to);
    }
    const options = {
      to,
      fee,
      amount: data.depositAmount,
      destinationInfo,
      wallet,
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
      const toCrypto = ractive.get('toCrypto');
      const toAmount = ractive.get('toAmount');
      showConfirmation({
        ...options,
        type: 'exchange',
        async onSuccess(modal) {
          try {
            modal.fire('close');
            await details.set('changellyInfo', data);
            emitter.emit('change-changelly-step', 'awaiting', data);
          } catch (err) {
            console.error(err);
          }
        },
        exchangeTo: `≈ ${toAmount} ${toCrypto.symbol}`,
      });
    } catch (err) {
      if (/Attempt to empty wallet/.test(err.details)) {
        ractive.find('#changelly_from_amount').value = toUnitString(err.sendableBalance);
        estimate({ amountCorrection: false });
      }
    }
  }

  function getFirstCrypto(ignoreId) {
    return coins.find((coin) => coin._id !== ignoreId);
  }

  function setFromCrypto(fromCrypto) {
    ractive.set('fromCrypto', fromCrypto);
    if (fromCrypto === ractive.get('toCrypto') && prevFromCryptoId) {
      const prevCrypto = coins.find((coin) => coin._id === prevFromCryptoId);
      setToCrypto(prevCrypto);
    }
    prevFromCryptoId = fromCrypto._id;
  }

  function setToCrypto(toCrypto) {
    ractive.set('toCrypto', toCrypto);
    ractive.set('hasWalletAddress', getWalletById(toCrypto._id) && toCrypto.supported);
    ractive.set('toAddress', '');
    if (toCrypto === ractive.get('fromCrypto') && prevToCryptoId) {
      const prevCrypto = coins.find((coin) => coin._id === prevToCryptoId);
      setFromCrypto(prevCrypto);
    }
    prevToCryptoId = toCrypto._id;
  }

  async function setCoins() {
    coins = [];
    const cryptos = await crypto.getCryptos();
    const changellyCoins = cryptos.filter((item) => item.changelly);
    const walletTokens = details.get('tokens');
    const all = [...walletCoins, ...walletTokens];
    all.forEach((item) => {
      const coin = changellyCoins.find((crypto) => crypto._id === item._id);
      if (coin) {
        coins.push(coin);
        changellyCoins.splice(changellyCoins.indexOf(coin), 1);
      }
    });
    coins = coins.concat(changellyCoins.sort((a, b) => {
      return a.symbol.localeCompare(b.symbol);
    }));
    ractive.set('coins', coins);
  }

  function estimate(config) {
    ractive.set('isLoading', true);
    ractive.set('toAmount', '...');
    const pair = ractive.get('fromCrypto')._id + '_' + ractive.get('toCrypto')._id;
    if (pair !== _pair) {
      ractive.set('isFirstEstimate', true);
      _pair = pair;
    }
    config = { amountCorrection: true, ...config };
    debounceEstimate(config);
  }

  const debounceEstimate = _.debounce(async ({ amountCorrection }) => {
    if (!ractive.el.classList.contains('current')) return;
    try {
      const fromCrypto = ractive.get('fromCrypto');
      const toCrypto = ractive.get('toCrypto');
      const { minAmount, maxAmount } = await changelly.getPairsParams(fromCrypto._id, toCrypto._id);
      _maxAmount = parseFloat(maxAmount) || 0;
      const input = ractive.find('#changelly_from_amount');
      let fromAmount = input.value || 0;
      ractive.set('minAmount', minAmount);
      if (amountCorrection && input !== document.activeElement && (parseFloat(fromAmount) < parseFloat(minAmount))) {
        fromAmount = minAmount;
        input.value = minAmount;
        _fromAmount = minAmount;
      }
      const data = await changelly.estimate(
        fromCrypto._id,
        toCrypto._id,
        fromAmount
      );
      ractive.set('rate', data.rate);
      ractive.set('toAmount', data.result);
      ractive.set('isLoading', false);
      ractive.set('isFirstEstimate', false);
    } catch (err) {
      ractive.set('rate', '?');
      ractive.set('toAmount', '?');
      ractive.set('minAmount', '?');
      ractive.set('isLoading', false);
      ractive.set('isFirstEstimate', false);
      console.error(err);
    }
  }, 500);

  return ractive;
}
