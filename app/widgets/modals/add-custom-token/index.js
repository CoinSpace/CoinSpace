import Ractive from 'widgets/modals/base';
import emitter from 'lib/emitter';
import { showError } from 'widgets/modals/flash';
import { translate } from 'lib/i18n';
import qrcode from 'lib/qrcode';
import details from 'lib/wallet/details';
import tokens from 'lib/tokens';
import initDropdown from 'widgets/dropdown';
import content from './_content.ract';

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
      { value: 'ethereum', name: 'Ethereum' },
      { value: 'binance-smart-chain', name: 'Binance Smart' },
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

    const network = blockchainDropdown.getValue();
    token = tokens.getTokenByAddress(address, network);

    if (!token) {
      token = await tokens.requestTokenByAddress(address, network).catch((err) => {
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

    const walletTokensSubset = walletTokens.filter((item) => item.network === network);
    if ((token._id && walletTokensSubset.map(item => item._id).includes(token._id))
        || walletTokensSubset.map(item => item.address).includes(token.address)) {
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
