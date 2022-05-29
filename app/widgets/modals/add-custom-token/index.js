import Ractive from 'widgets/modals/base';
import emitter from 'lib/emitter';
import { showError } from 'widgets/modals/flash';
import { translate } from 'lib/i18n';
import qrcode from 'lib/qrcode';
import details from 'lib/wallet/details';
import crypto from 'lib/crypto';
import initDropdown from 'widgets/dropdown';
import content from './_content.ract';
import binanceSmartChain from '@coinspace/crypto-db/crypto/binance-coin@binance-smart-chain.json';
import ethereum from '@coinspace/crypto-db/crypto/ethereum@ethereum.json';
import avalanche from '@coinspace/crypto-db/crypto/avalanche@c-chain.json';

function open() {

  const ractive = new Ractive({
    partials: {
      content,
    },
    data: {
      qrScannerAvailable: qrcode.isScanAvailable,
      address: '',
      isValidating: false,
    },
  });

  const blockchainDropdown = initDropdown({
    el: ractive.find('#js-blockchain'),
    options: [
      { value: ethereum.platform, name: ethereum.name },
      { value: binanceSmartChain.platform, name: binanceSmartChain.name },
      { value: avalanche.platform, name: avalanche.name },
    ],
    value: 'ethereum',
    id: 'blockchain',
  });

  ractive.on('clearAddress', () => {
    ractive.set('address', '');
    ractive.find('#contract_address').focus();
  });

  ractive.on('addToken', async () => {
    ractive.set('isValidating', true);
    const walletTokens = details.get('tokens');
    const address = ractive.get('address').trim().toLowerCase();
    let token;

    if (!address) {
      ractive.set('isValidating', false);
      return showError({ message: translate('Please fill out address.') });
    }

    const platform = blockchainDropdown.getValue();
    token = crypto.getTokenByAddress(address, platform);

    if (!token) {
      token = await crypto.requestTokenByAddress(address, platform).catch((err) => {
        if (err.status === 400 || err.status === 404) {
          showError({
            message: translate('address is not a valid address.', {
              address,
            }),
          });
        }
        console.error(err);
      });
    }

    if (!token) {
      ractive.set('isValidating', false);
      return;
    }

    const walletTokensSubset = walletTokens.filter((item) => item.platform === platform);
    if (walletTokensSubset.find(item => item._id === token._id)) {
      ractive.set('isValidating', false);
      return showError({ message: translate('This Token has already been added.') });
    }

    walletTokens.push(token);
    details.set('tokens', walletTokens)
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        ractive.set('isValidating', false);
        ractive.fire('cancel');
        emitter.emit('set-tokens', 'list');
        emitter.emit('token-added', token);
      });
  });

  ractive.on('openQr', () => {
    qrcode.scan(({ address }) => {
      ractive.set('address', address);
    });
  });

  return ractive;
}

export default open;
