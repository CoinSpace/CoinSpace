import Ractive from 'widgets/modals/base';
import qrcode from 'lib/qrcode';
import showConfirmation from 'widgets/modals/confirm-send';
import { showInfo, showError, showSuccess } from 'widgets/modals/flash';
import { translate } from 'lib/i18n';
import { getWallet } from 'lib/wallet';
import { toUnitString } from 'lib/convert';
import content from './_content.ract';

let ractive;

function open() {

  ractive = new Ractive({
    partials: {
      content,
    },
    data: {
      isLoading: false,
      qrScannerAvailable: qrcode.isScanAvailable,
    },
  });

  ractive.on('clearPrivateKey', () => {
    const input = ractive.find('#private_key');
    ractive.set('privateKey', '');
    input.focus();
  });

  ractive.on('transfer', () => {
    ractive.set('isLoading', true);
    const wallet = getWallet();
    const to = wallet.getNextAddress();
    let privateKey;
    try {
      privateKey = wallet.createPrivateKey(ractive.get('privateKey'));
    } catch (err) {
      return handleError(new Error('Invalid private key'));
    }
    wallet.getImportTxOptions(privateKey).then((importTxOptions) => {
      if (parseFloat(importTxOptions.amount) === 0) {
        ractive.set('isLoading', false);
        return showInfo({ message: translate('This private key has no funds for transfer.') });
      }
      if (wallet.crypto._id === 'bitcoin-cash@bitcoin-cash') {
        importTxOptions.to = wallet.toLegacyAddress(to);
        importTxOptions.alias = to;
      } else {
        importTxOptions.to = to;
      }

      let fee;
      if (['ripple', 'stellar', 'eos'].includes(wallet.crypto.platform)) {
        fee = toUnitString(wallet.defaultFee);
      } else if (['ethereum', 'binance-smart-chain', 'c-chain', 'ethereum-classic'].includes(wallet.crypto.platform)) {
        fee = toUnitString(wallet.defaultFee, 18);
      }

      showConfirmation({
        type: 'import',
        to: importTxOptions.to,
        alias: importTxOptions.alias,
        amount: toUnitString(importTxOptions.amount),
        fee,
        fadeInDuration: 0,
        wallet,
        importTxOptions,
        onSuccess(modal) {
          showSuccess({
            el: modal.el,
            title: translate('Transaction Successful'),
            message: translate('Your transaction will appear in your history tab shortly.'),
            fadeInDuration: 0,
          });
        },
      });

    }).catch(handleError);
  });

  ractive.on('open-qr', () => {
    qrcode.scan(({ address }) => {
      if (address) ractive.set('privateKey', address);
    });
  });

  function handleError(err) {
    ractive.set('isLoading', false);
    if (/^Private key equal wallet private key/.test(err.message)) {
      return showError({ message: translate('Please enter a private key other than your wallet private key') });
    } else if (err.message === 'Invalid private key') {
      return showError({ message: translate('Invalid private key') });
    } else if (err.message === 'cs-node-error') {
      return showError({
        message: translate('Network node error. Please try again later.', {
          network: getWallet().crypto.name,
        }),
      });
    }
    console.error(`not translated error: ${err.message}`);
    return showError({ message: err.message });
  }

  return ractive;
}

export default open;
