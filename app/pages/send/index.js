import Ractive from 'lib/ractive';
import Big from 'big.js';
import emitter from 'lib/emitter';
import details from 'lib/wallet/details';
import { getWallet, updateWallet } from 'lib/wallet';
import { setToAlias } from 'lib/wallet';
import { showError } from 'widgets/modals/flash';
import showConfirmation from 'widgets/modals/confirm-send';
import showMecto from 'widgets/modals/mecto';
import showTooltip from 'widgets/modals/tooltip';
import { validateSend } from 'lib/wallet/validator';
import { getDestinationInfo } from 'lib/wallet';
import { resolveTo } from 'lib/openalias';
import qrcode from 'lib/qrcode';
import initEosSetup from 'widgets/eos/setup';
import { toAtom, toUnitString, cryptoToFiat, fiatToCrypto, toDecimalString } from 'lib/convert';
import { translate } from 'lib/i18n';
import ticker from 'lib/ticker-api';
import { getCrypto } from 'lib/crypto';
import bip21 from 'lib/bip21';
import template from './index.ract';

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

export default function(el) {
  const rates = ticker.getRates(getCrypto()._id);
  const currency = details.get('systemInfo').preferredCurrency;

  const ractive = new Ractive({
    el,
    template,
    data: {
      currency,
      rates,
      qrScannerAvailable: qrcode.isScanAvailable,
      maxAmount: '0',
      fee: '0',
      to: '',
      feeName: 'default',
      fees: [
        { value: '0', name: 'minimum', title: translate('minimum') },
        { value: '0', name: 'default', title: translate('default'), default: true },
        { value: '0', name: 'fastest', title: translate('fastest') },
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
      factors: false,
      isCryptoInputHidden: !rates[currency],
    },
  });

  let isSyncing = true;

  initEosSetup(ractive.find('#eos-setup'));

  ractive.on('before-show', () => {
    if (!isSyncing) {
      updateWallet();
    }
    const url = window.localStorage.getItem('_cs_bip21');
    if (url) bip21Handler(url);
  });

  ractive.on('open-qr', () => {
    qrcode.scan(setBip21Values);
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
    setFiatFromCrypto();
  });

  emitter.on('rates-updated', () => {
    ractive.set('rates', ticker.getRates(getCrypto()._id));
    ractive.set('isCryptoInputHidden', !ractive.get('rates')[ractive.get('currency')]);
    setFiatFromCrypto();
  });

  emitter.on('handleOpenURL', bip21Handler);

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
        feeName: ractive.get('feeName'),
        destinationInfo,
        amount: normalizeCrypto(toDecimalString(ractive.find('#crypto').value)),
        denomination: ractive.get('denomination'),
        onSuccessDismiss() {
          ractive.set({ to: '' });
          ractive.find('#crypto').value = '';
          ractive.find('#fiat').value = '';
          setFees();
          if (wallet.networkName === 'ripple') {
            ractive.find('#destination-tag').value = '';
            ractive.find('#invoice-id').value = '';
          } else if (wallet.networkName === 'stellar' || wallet.networkName === 'eos') {
            ractive.find('#memo').value = '';
          }
          if (['ios', 'android-play'].includes(process.env.BUILD_PLATFORM)) {
            // eslint-disable-next-line no-undef
            cordova.plugins.InAppReview.requestReviewDialog().catch(() => {});
          }
        },
      };

      if (wallet.networkName === 'ethereum') {
        wallet.gasLimit = ractive.find('#gas-limit').value;
      } else if (wallet.networkName === 'ripple') {
        options.tag = ractive.find('#destination-tag').value;
        options.invoiceId = ractive.find('#invoice-id').value;
      } else if (wallet.networkName === 'stellar') {
        options.memo = ractive.find('#memo').value;
      } else if (wallet.networkName === 'eos') {
        options.memo = ractive.find('#memo').value;
      }

      return validateAndShowConfirm(options);
    }).catch((err) => {
      ractive.set('validating', false);
      if (/is not a valid address/.test(err.message)) {
        return showError({
          title: translate('Uh Oh...'),
          message: translate('Please enter a valid address to send to'),
        });
      } else {
        console.error(`not translated error: ${err.message}`);
        return showError({
          title: translate('Uh Oh...'),
          message: err.message,
        });
      }
    });
  });

  emitter.on('wallet-ready', () => {
    const wallet = getWallet();
    isSyncing = false;
    ractive.set('isEthereum', wallet.networkName === 'ethereum');
    ractive.set('isRipple', wallet.networkName === 'ripple');
    ractive.set('isStellar', wallet.networkName === 'stellar');
    ractive.set('isEOS', wallet.networkName === 'eos');
    ractive.set('needToSetupEos', wallet.networkName === 'eos' && !wallet.isActive);
    ractive.set('denomination', wallet.denomination);
    ractive.set('factors', FACTORS[getCrypto()._id]);
    ractive.set('factor', wallet.denomination);
    setFees(true);
    if (wallet.networkName === 'ethereum') {
      ractive.set('feeDenomination', 'ETH');
      if (ractive.find('#gas-limit')) {
        ractive.find('#gas-limit').value = wallet.gasLimit;
      }
      ractive.set('gasLimit', wallet.gasLimit);
    } else {
      ractive.set('feeDenomination', wallet.denomination);
    }
    setFiatFromCrypto();
  });

  emitter.on('wallet-update', () => {
    setFees();
  });

  function setFees(setDefaultFeeOption) {
    if (isSyncing) return;
    const wallet = getWallet();
    const value = toAtom(normalizeCrypto(ractive.find('#crypto').value) || 0);
    let fees = [];

    if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash', 'monero']
      .includes(wallet.networkName)) {
      fees = wallet.estimateFees(value).map((item) => {
        if (setDefaultFeeOption) {
          if (item.default === true) {
            ractive.set('feeName', item.name);
          }
        }
        return {
          ...item,
          estimate: toUnitString(item.estimate),
          maxAmount: toUnitString(item.maxAmount),
        };
      });
    } else if (['ripple', 'stellar', 'eos'].includes(wallet.networkName)) {
      fees = [{
        name: 'default',
        estimate: toUnitString(wallet.defaultFee),
        maxAmount: toUnitString(wallet.maxAmount),
      }];
      ractive.set('feeName', 'default');
    } else if (wallet.networkName === 'ethereum') {
      fees = [{
        name: 'default',
        estimate: toUnitString(wallet.defaultFee, 18),
        maxAmount: toUnitString(wallet.maxAmount),
      }];
      ractive.set('feeName', 'default');
    }

    ractive.set('fees', fees);
    ractive.fire('change-fee');
  }

  ractive.on('change-fee', () => {
    const feeName = ractive.get('feeName');
    const fees = ractive.get('fees');
    const fee = fees.find((item) => item.name === feeName);
    ractive.set('maxAmount', fee.maxAmount);
    ractive.set('fee', fee.estimate);
  });

  ractive.on('set-max-amount', () => {
    ractive.find('#crypto').value = denormalizeCrypto(ractive.get('maxAmount'));
    ractive.fire('crypto-to-fiat');
  });

  ractive.on('crypto-to-fiat', () => {
    setFiatFromCrypto();
    setFees();
  });

  ractive.on('fiat-to-crypto', () => {
    setCryptoFromFiat();
    setFees();
  });

  ractive.on('gas-limit', () => {
    const wallet = getWallet();
    wallet.gasLimit = ractive.find('#gas-limit').value || 0;
    setFees();
  });

  ractive.on('clearTo', ()=> {
    const passfield = ractive.find('#to');
    ractive.set('to', '');
    passfield.focus();
  });

  ractive.on('help-fee', () => {
    showTooltip({
      message: translate('Amount of coins that is charged from your balance for single transaction (:url).', {
        // eslint-disable-next-line max-len
        url: "<a href=\"\" onclick=\"return window.safeOpen('https://coin.space/all-about-bitcoin-fees/', '_blank');\">" + translate('more info') + '</a>',
      }),
      isHTML: true,
    });
  });

  ractive.on('help-gas-limit', () => {
    showTooltip({
      // eslint-disable-next-line max-len
      message: translate('Gas limit is the amount of gas to send with your transaction. Increasing this number will not get your transaction confirmed faster. Sending ETH is equal 21000. Sending Tokens is equal around 200000.'),
    });
  });

  ractive.on('help-destination-tag', () => {
    showTooltip({
      // eslint-disable-next-line max-len
      message: translate('An arbitrary unsigned 32-bit integer that identifies a reason for payment or a non-Ripple account.'),
    });
  });

  ractive.on('help-invoice-id', () => {
    showTooltip({
      message: translate('A 256-bit hash that can be used to identify a particular payment.'),
    });
  });

  ractive.on('help-memo', () => {
    const wallet = getWallet();
    let message = '';
    if (wallet.networkName === 'stellar') {
      message = translate('The memo contains optional extra information. A string up to 28-bytes long.');
    } else if (wallet.networkName === 'eos') {
      message = translate('The memo contains optional extra information. A string up to 256-bytes long.');
    }
    showTooltip({ message });
  });

  function normalizeCrypto(amount) {
    if (!amount) return amount;
    const factors = ractive.get('factors');
    if (!factors) return amount;
    if (!ractive.get('factors')) return amount;
    const factor = factors[ractive.get('factor')];
    if (factor !== 1) {
      // decimals is 8 for bitcoin like crypto
      return Big(amount).div(factor).toFixed(8);
    }
    return amount;
  }

  function denormalizeCrypto(amount) {
    if (!amount) return amount;
    const factors = ractive.get('factors');
    if (!factors) return amount;
    const factor = factors[ractive.get('factor')];
    if (factor !== 1) {
      return Big(amount).times(factor).toFixed(8 - Math.log10(factor));
    }
    return amount;
  }

  function setFiatFromCrypto() {
    const crypto = ractive.find('#crypto').value || 0;

    const exchangeRate = ractive.get('rates')[ractive.get('currency')];
    if (typeof exchangeRate !== 'number') return;

    const fiat = crypto ? cryptoToFiat(normalizeCrypto(crypto), exchangeRate) : '';
    ractive.find('#fiat').value = fiat || '';
  }

  function setCryptoFromFiat() {
    const fiat = ractive.find('#fiat').value || 0;

    const exchangeRate = ractive.get('rates')[ractive.get('currency')];
    const crypto = fiat ? denormalizeCrypto(fiatToCrypto(fiat, exchangeRate)) : '';
    ractive.find('#crypto').value = crypto || '';
  }

  async function validateAndShowConfirm(options) {
    try {
      await validateSend(options);
      ractive.set('validating', false);
      showConfirmation(options);
    } catch (err) {
      ractive.set('validating', false);
      if (/Attempt to empty wallet/.test(err.message)) {
        ractive.find('#crypto').value = denormalizeCrypto(toUnitString(err.sendableBalance));
        ractive.fire('crypto-to-fiat');
      }
    }
  }

  function bip21Handler(url) {
    if (!bip21.isValidScheme(url)) return;
    setBip21Values(bip21.decode(url));
    window.localStorage.removeItem('_cs_bip21');
  }

  function setBip21Values({ address, value, tag }) {
    if (address) ractive.set('to', address);
    if (value) {
      ractive.find('#crypto').value = denormalizeCrypto(value);
      ractive.fire('crypto-to-fiat');
    }
    const $tag = ractive.find('#destination-tag');
    if (tag && $tag) {
      $tag.value = tag;
    }
  }

  return ractive;
}
