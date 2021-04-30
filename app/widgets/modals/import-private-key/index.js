import Ractive from 'widgets/modals/base';
import { showError } from 'widgets/modals/flash';
import qrcode from 'lib/qrcode';
import showConfirmation from 'widgets/modals/confirm-send';
import { showInfo } from 'widgets/modals/flash';
import { getWallet } from 'lib/wallet';
import { setToAlias } from 'lib/wallet';
import { toUnitString } from 'lib/convert';
import _ from 'lodash';
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
        return showInfo({ message: 'This private key has no coins for transfer.' });
      }
      importTxOptions.to = to;
      setToAlias(importTxOptions);

      showConfirmation({
        wallet,
        to: importTxOptions.to,
        alias: importTxOptions.alias,
        amount: toUnitString(importTxOptions.amount),
        denomination: wallet.denomination,
        fadeInDuration: 0,
        importTxOptions,
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
      return showError({ message: 'Please enter a private key other than your wallet private key' });
    } else if (err.message === 'cs-node-error') {
      return showError({
        message: 'Network node error. Please try again later.',
        interpolations: { network: _.upperFirst(getWallet().networkName) },
      });
    }
    return showError({ message: err.message });
  }

  return ractive;
}

export default open;
