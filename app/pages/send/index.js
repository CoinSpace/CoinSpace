'use strict';

const Ractive = require('lib/ractive');
const Big = require('big.js');
const emitter = require('lib/emitter');
const details = require('lib/wallet/details');
const { getWallet } = require('lib/wallet');
const { setToAlias } = require('lib/wallet');
const { showError } = require('widgets/modals/flash');
const { showInfo } = require('widgets/modals/flash');
const showConfirmation = require('widgets/modals/confirm-send');
const showMecto = require('widgets/modals/mecto');
const showTooltip = require('widgets/modals/tooltip');
const { validateSend } = require('lib/wallet');
const { getDestinationInfo } = require('lib/wallet');
const { resolveTo } = require('lib/openalias');
const qrcode = require('lib/qrcode');
const initEosSetup = require('widgets/eos/setup');
const { toAtom, toUnitString } = require('lib/convert');
const { translate } = require('lib/i18n');
const ticker = require('lib/ticker-api');
const { getCrypto } = require('lib/crypto');

const FACTORS = {
  bitcoin: {
    BTC: 1,
    mBTC: 1000,
    μBTC: 1000000,
  },
  bitcoincash: {
    BCH: 1,
    mBCH: 1000,
    μBCH: 1000000,
  },
  bitcoinsv: {
    BSV: 1,
    mBSV: 1000,
    μBSV: 1000000,
  },
};

module.exports = function(el) {
  const rates = ticker.getRates()[getCrypto()._id] || {};
  const currency = details.get('systemInfo').preferredCurrency;

  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      cryptoId: getCrypto()._id,
      currency,
      rates,
      qrScannerAvailable: qrcode.isScanAvailable,
      maxAmount: '0',
      fee: '0',
      to: '',
      feeIndex: 0,
      fees: [
        { value: '0', name: 'minimum' },
        { value: '0', name: 'default', default: true },
        { value: '0', name: 'fastest' },
      ],
      isEthereum: false,
      isRipple: false,
      isStellar: false,
      isEOS: false,
      isLoading: false,
      gasLimit: '',
      denomination: '',
      feeDenomination: '',
      factor: '',
      factors: {},
      isCryptoInputHidden: !rates[currency],
    },
  });

  let isSyncing = true;

  initEosSetup(ractive.find('#eos-setup'));

  ractive.on('before-show', () => {
    const network = getWallet().networkName;
    ractive.set('isEthereum', network === 'ethereum');
    ractive.set('isRipple', network === 'ripple');
    ractive.set('isStellar', network === 'stellar');
    ractive.set('isEOS', network === 'eos');
  });

  ractive.on('open-qr', () => {
    qrcode.scan(({ address, value, tag }) => {
      if (address) ractive.set('to', address);
      if (value) {
        ractive.find('#crypto').value = denormalizeCrypto(value);
        ractive.fire('crypto-to-fiat');
      }
      const $tag = ractive.find('#destination-tag');
      if (tag && $tag) {
        $tag.value = tag;
      }
    });
  });

  ractive.on('open-geo', ()=> {
    showMecto((address) => {
      ractive.set('to', address);
    });
  });

  emitter.on('sync', () => {
    isSyncing = true;
  });

  emitter.on('currency-changed', (currency) => {
    ractive.set('currency', currency);
    ractive.set('isCryptoInputHidden', !ractive.get('rates')[ractive.get('currency')]);
    ractive.fire('crypto-to-fiat');
  });

  emitter.on('rates-updated', (rates) => {
    ractive.set('rates', rates[getCrypto()._id] || {});
    ractive.set('isCryptoInputHidden', !ractive.get('rates')[ractive.get('currency')]);
    ractive.fire('crypto-to-fiat');
  });

  ractive.on('open-send', () => {
    ractive.set('validating', true);

    const to = ractive.get('to').trim();
    const fee = ractive.get('fee');

    const delay = function(n) {
      return new Promise((resolve) => { setTimeout(resolve, n); });
    };

    const wallet = getWallet();

    Promise.all([
      resolveTo(wallet.networkName, to),
      getDestinationInfo(to),
      delay(100), // in order to activate loader
    ]).then((results) => {

      const data = results[0];
      setToAlias(data);

      const destinationInfo = results[1];

      const options = {
        wallet,
        to: data.to,
        alias: data.alias,
        fee,
        destinationInfo,
        amount: normalizeCrypto(ractive.find('#crypto').value),
        denomination: ractive.get('denomination'),
        onSuccessDismiss() {
          ractive.set({ to: '' });
          ractive.find('#crypto').value = '';
          ractive.find('#fiat').value = '';
          setFees();
          ractive.fire('change-fee');
          if (wallet.networkName === 'ripple') {
            ractive.find('#destination-tag').value = '';
            ractive.find('#invoice-id').value = '';
          } else if (wallet.networkName === 'stellar' || wallet.networkName === 'eos') {
            ractive.find('#memo').value = '';
          }
          if (ractive.get('BUILD_TYPE') === 'phonegap') {
            // eslint-disable-next-line no-undef
            cordova.plugins.InAppReview.requestReviewDialog();
          }
        },
      };

      if (wallet.networkName === 'ethereum') {
        wallet.gasLimit = ractive.find('#gas-limit').value;
      } else if (wallet.networkName === 'ripple') {
        options.tag = ractive.find('#destination-tag').value;
        options.invoiceId = ractive.find('#invoice-id').value;
        options.amount = Big(options.amount || '0').toFixed(6).replace(/0+$/, '').replace(/\.+$/, '');
      } else if (wallet.networkName === 'stellar') {
        options.amount = Big(options.amount || '0').toFixed(7).replace(/0+$/, '').replace(/\.+$/, '');
        options.memo = ractive.find('#memo').value;
      } else if (wallet.networkName === 'eos') {
        options.amount = Big(options.amount || '0').toFixed(4).replace(/0+$/, '').replace(/\.+$/, '');
        options.memo = ractive.find('#memo').value;
      }

      validateAndShowConfirm(options);
    }).catch((e) => {
      ractive.set('validating', false);
      if (/is not a valid address/.test(e.message)) {
        return showError({ title: 'Uh Oh...', message: 'Please enter a valid address to send to' });
      }
    });
  });

  emitter.on('wallet-ready', () => {
    const wallet = getWallet();
    isSyncing = false;
    setFees(true);
    ractive.fire('change-fee');
    ractive.set('cryptoId', getCrypto()._id);
    ractive.set('needToSetupEos', wallet.networkName === 'eos' && !wallet.isActive);
    ractive.set('denomination', wallet.denomination);
    ractive.set('factors', FACTORS[getCrypto()._id]);
    ractive.set('factor', wallet.denomination);
    if (wallet.networkName === 'ethereum') {
      ractive.set('feeDenomination', 'ETH');
      if (ractive.find('#gas-limit')) {
        ractive.find('#gas-limit').value = wallet.gasLimit;
      }
      ractive.set('gasLimit', wallet.gasLimit);
    } else {
      ractive.set('feeDenomination', wallet.denomination);
    }
  });

  function setFees(setDefaultFeeOption) {
    if (isSyncing) return;
    const wallet = getWallet();
    const value = toAtom(normalizeCrypto(ractive.find('#crypto').value) || 0);
    let fees = [];
    if (setDefaultFeeOption) ractive.set('feeIndex', 0);

    if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash'].indexOf(wallet.networkName) !== -1) {
      const estimates = wallet.estimateFees(value);
      const minimums = wallet.minimumFees(value);
      fees = wallet.feeRates.map((item, i) => {
        item.estimate = estimates[i] ? toUnitString(estimates[i]) : toUnitString(minimums[i]);
        return item;
      });
      if (setDefaultFeeOption) {
        for (let i = 0; i< wallet.feeRates.length; i++) {
          if (wallet.feeRates[i].default) {
            ractive.set('feeIndex', i);
            break;
          }
        }
      }
    } else if (['ripple', 'stellar', 'eos'].indexOf(wallet.networkName) !== -1) {
      fees = [{ estimate: wallet.getDefaultFee() }];
    } else if (wallet.networkName === 'ethereum') {
      fees = [{ estimate: toUnitString(wallet.getDefaultFee(), 18) }];
    }

    ractive.set('fee', fees[ractive.get('feeIndex')].estimate);
    ractive.set('fees', fees);
  }

  function normalizeCrypto(amount) {
    if (!amount) return amount;
    if (['bitcoin', 'bitcoincash', 'bitcoinsv'].includes(ractive.get('cryptoId'))) {
      const factor = ractive.get('factors')[ractive.get('factor')];
      if (factor !== 1) {
        // decimals is 8 for bitcoin like crypto
        return Big(amount).div(factor).toFixed(8);
      }
    }
    return amount;
  }

  function denormalizeCrypto(amount) {
    if (!amount) return amount;
    if (['bitcoin', 'bitcoincash', 'bitcoinsv'].includes(ractive.get('cryptoId'))) {
      const factor = ractive.get('factors')[ractive.get('factor')];
      if (factor !== 1) {
        return Big(amount).times(factor).toFixed(8 - Math.log10(factor));
      }
    }
    return amount;
  }

  ractive.on('change-fee', () => {
    const wallet = getWallet();
    const index = ractive.get('feeIndex');
    if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash'].indexOf(wallet.networkName) !== -1) {
      const maxAmount = wallet.maxAmounts[index] ? wallet.maxAmounts[index].value : 0;
      ractive.set('maxAmount', toUnitString(maxAmount));
    } else {
      ractive.set('maxAmount', toUnitString(wallet.getMaxAmount()));
    }
    ractive.set('fee', ractive.get('fees')[index].estimate);
  });

  ractive.on('set-max-amount', () => {
    ractive.find('#crypto').value = denormalizeCrypto(ractive.get('maxAmount'));
    ractive.fire('crypto-to-fiat');
  });

  ractive.on('crypto-to-fiat', () => {
    const crypto = ractive.find('#crypto').value || 0;

    const exchangeRate = ractive.get('rates')[ractive.get('currency')];
    if (typeof exchangeRate !== 'number') return;

    const fiat = crypto ? Big(normalizeCrypto(crypto)).times(exchangeRate).toFixed(2) : '';
    ractive.find('#fiat').value = fiat;
    setFees();
  });

  ractive.on('fiat-to-crypto', () => {
    const fiat = ractive.find('#fiat').value || 0;

    const exchangeRate = ractive.get('rates')[ractive.get('currency')];
    let crypto = '0';
    if (exchangeRate) {
      // TODO toFixed(decimals)
      crypto = fiat ? denormalizeCrypto(Big(fiat).div(exchangeRate).toFixed(8)) : '';
    }
    ractive.find('#crypto').value = crypto;
    setFees();
  });

  ractive.on('gas-limit', () => {
    const wallet = getWallet();
    wallet.gasLimit = ractive.find('#gas-limit').value || 0;
    setFees();
    ractive.fire('change-fee');
  });

  ractive.on('clearTo', ()=> {
    const passfield = ractive.find('#to');
    ractive.set('to', '');
    passfield.focus();
  });

  ractive.on('focusAmountInput', (context) => {
    context.node.parentNode.style.zIndex = 5000;
  });

  ractive.on('blurAmountInput', (context) => {
    context.node.parentNode.style.zIndex = '';
  });

  ractive.on('help-fee', () => {
    showTooltip({
      message: 'Amount of coins that is charged from your balance for single transaction (:url).',
      // eslint-disable-next-line max-len
      interpolations: { url: "<a href=\"\" onclick=\"return window.safeOpen('https://coin.space/all-about-bitcoin-fees/', '_blank');\">" + translate('more info') + "</a>" },
      isHTML: true,
    });
  });

  ractive.on('help-gas-limit', () => {
    showTooltip({
      message: 'Gas limit is the amount of gas to send with your transaction. ' +
      'Increasing this number will not get your transaction confirmed faster. ' +
      'Sending ETH is equal 21000. Sending Tokens is equal around 200000.',
    });
  });

  ractive.on('help-destination-tag', () => {
    showTooltip({
      message: 'An arbitrary unsigned 32-bit integer that identifies a reason for payment or a non-Ripple account.',
    });
  });

  ractive.on('help-invoice-id', () => {
    showTooltip({
      message: 'A 256-bit hash that can be used to identify a particular payment.',
    });
  });

  ractive.on('help-memo', () => {
    const wallet = getWallet();
    let message = '';
    if (wallet.networkName === 'stellar') {
      message = 'The memo contains optional extra information. A string up to 28-bytes long.';
    } else if (wallet.networkName === 'eos') {
      message = 'The memo contains optional extra information. A string up to 256-bytes long.';
    }
    showTooltip({ message });
  });

  function validateAndShowConfirm(options) {
    try {
      validateSend(options);
      ractive.set('validating', false);
      showConfirmation(options);
    } catch (err) {
      ractive.set('validating', false);
      const { interpolations } = err;
      if (/trying to empty your wallet/.test(err.message)) {
        ractive.find('#crypto').value = denormalizeCrypto(interpolations.sendableBalance);
        ractive.fire('crypto-to-fiat');
        return showInfo({ message: err.message, interpolations });
      }
      return showError({
        title: 'Uh Oh...',
        message: err.message,
        href: err.href,
        linkText: err.linkText,
        interpolations,
      });
    }
  }

  return ractive;
};
