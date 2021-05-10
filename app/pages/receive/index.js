import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import showTooltip from 'widgets/modals/tooltip';
import geo from 'lib/geo';
import { showError } from 'widgets/modals/flash';
import showSetDetails from 'widgets/modals/set-details';
import qrcode from 'lib/qrcode';
import initEosSetup from 'widgets/eos/setup';
import details from 'lib/wallet/details';
import clipboard from 'lib/clipboard';
import { translate } from 'lib/i18n';
import { getWallet } from 'lib/wallet';
import template from './index.ract';
import { lock, unlock } from 'lib/wallet/security';

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
    data: {
      address: '',
      qrVisible: false,
      connecting: false,
      broadcasting: false,
      isPhonegap: process.env.BUILD_TYPE === 'phonegap',
      addressTypes: [],
      addressType: '',
      addressTooltip: false,
      isMonero: false,
      isAccepting: false,
      txId: '',
      getAddressTypeLabel(type) {
        if (type === 'p2pkh') return '(P2PKH)';
        if (type === 'p2sh') return '(P2SH)';
        if (type === 'p2wpkh') return '(Bech32)';
        return '-';
      },
      getAddressTypeOption(type) {
        if (type === 'p2pkh') return translate('P2PKH - Legacy');
        if (type === 'p2sh') return translate('P2SH - SegWit compatible');
        if (type === 'p2wpkh') return translate('Bech32 - SegWit native');
        return '-';
      },
    },
  });

  initEosSetup(ractive.find('#eos-setup'));

  clipboard(ractive, '.js-address-input', 'isCopiedAddress');

  emitter.on('wallet-ready', () => {
    const wallet = getWallet();
    ractive.set('needToSetupEos', wallet.networkName === 'eos' && !wallet.isActive);

    const addressTypes = (wallet.network && wallet.network.addressTypes) || [];
    ractive.set('addressTypes', addressTypes);
    ractive.set('addressType', wallet.addressType);
    ractive.set('addressTooltip', [
      'bitcoin',
      'bitcoincash',
      'bitcoinsv',
      'litecoin',
      'dogecoin',
      'dash',
    ].indexOf(wallet.networkName) !== -1);
    showAddress();
  });
  emitter.on('tx-sent', showAddress);
  emitter.on('change-address-type', showAddress);

  ractive.on('before-show', () => {
    const network = getWallet().networkName;
    ractive.set('isMonero', network === 'monero');
  });

  ractive.on('change-address-type', () => {
    const wallet = getWallet();
    const addressType = ractive.get('addressType');
    details.set(wallet.networkName + '.addressType', addressType)
      .then(() => {
        wallet.addressType = addressType;
        emitter.emit('change-address-type');
      })
      .catch(console.error);
  });

  ractive.on('toggle-broadcast', () => {
    if (ractive.get('connecting')) return;

    if (ractive.get('broadcasting')) {
      mectoOff();
    } else {
      showSetDetails(() => {
        mectoOn();
      });
    }
  });

  function mectoOff() {
    ractive.set('broadcasting', false);
    geo.remove();
  }

  async function mectoOn() {
    ractive.set('connecting', true);
    try {
      await geo.save();
      ractive.set('connecting', false);
      ractive.set('broadcasting', true);
    } catch (err) {
      return handleMectoError(err);
    }
  }

  ractive.on('share', () => {
    window.plugins.socialsharing.shareWithOptions({
      message: ractive.get('address'),
    });
  });

  ractive.on('email', () => {
    const address = ractive.get('address');
    const link = 'mailto:?body=' + encodeURIComponent(`${address}\n\nSent from Coin Wallet\nhttps://coin.space`);
    window.safeOpen(link, '_blank');
  });

  ractive.on('help-address', () => {
    // eslint-disable-next-line max-len
    let message = translate('Address will be changed after receiving funds. All previously used addresses remain valid and still can be used to receive funds multiple times. Please use fresh address for each receiving transaction to enhance your privacy.');
    if (ractive.get('addressTypes').length > 1) {
      message += '<br><br>';
      message += translate(
        // eslint-disable-next-line max-len
        'Not all address types are fully compatible on all platforms, so it is important to use a compatible address (:url).',
        // eslint-disable-next-line max-len
        { url: "<a href=\"\" onclick=\"return window.safeOpen('https://coin.space/all-about-address-types/', '_blank');\">" + translate('more info') + '</a>' }
      );
    }
    showTooltip({
      message,
      isHTML: true,
      isTranslated: true,
    });
  });

  ractive.on('clearTxId', () => {
    ractive.set('txId', '');
    ractive.find('#tx-id').focus();
  });

  ractive.on('accept', async () => {
    ractive.set('isAccepting', true);
    const wallet = getWallet();
    try {
      await unlock(wallet);
      await wallet.addTx(ractive.get('txId'));
      ractive.set('txId', '');
      emitter.emit('tx-added');
    } catch (err) {
      console.error(err);
      // TODO add error handling
    }
    await lock(wallet);
    ractive.set('isAccepting', false);
  });

  function showAddress() {
    const address = getWallet().getNextAddress();
    ractive.set('address', address);
    const $canvas = ractive.find('#qr_canvas');
    const qr = qrcode.encode(getWallet().networkName + ':' + address);
    $canvas.innerHTML = qr;
  }

  function handleMectoError(err) {
    showError({
      message: err.message,
    });
    ractive.set('connecting', false);
    ractive.set('broadcasting', false);
  }

  return ractive;
}
