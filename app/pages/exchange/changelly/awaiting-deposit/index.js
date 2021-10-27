import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import qrcode from 'lib/qrcode';
import details from 'lib/wallet/details';
import showTooltip from 'widgets/modals/tooltip';
import { translate } from 'lib/i18n';
import clipboard from 'lib/clipboard';
import template from './index.ract';
import footer from '../footer.ract';

const extraIdLabels = {
  XLM: 'Memo',
  EOS: 'Memo',
  XRP: 'Destination tag',
};

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
    data: {
      depositAmount: '',
      depositSymbol: '',
      depositAddress: '-',
      depositBlockchain: '',
      extraId: '',
      extraIdLabel: translate('Extra Id'),
      toAddress: '',
      toSymbol: '',
      toBlockchain: '',
      isPhonegap: process.env.BUILD_TYPE === 'phonegap',
      ref: process.env.CHANGELLY_REF,
    },
    partials: {
      footer,
    },
  });

  const delay = 60 * 1000; // 60 seconds
  let interval;

  ractive.on('before-show', (context) => {
    interval = setInterval(() => {
      emitter.emit('changelly');
    }, delay);

    ractive.set({
      depositAmount: context.depositAmount,
      depositAddress: context.depositAddress,
      depositBlockchain: context.depositBlockchain,
      extraId: context.extraId,
      extraIdLabel: translate(extraIdLabels[context.depositSymbol] || 'Extra Id'),
      toAddress: context.toAddress,
      toSymbol: context.toSymbol,
      toBlockchain: context.toBlockchain,
    });

    const canvas = ractive.find('#deposit_qr_canvas');
    const qr = qrcode.encode(context.depositAddress);
    canvas.innerHTML = qr;
  });

  clipboard(ractive, '.js-deposit-address', 'isCopiedDepositAddress');
  clipboard(ractive, '.js-extra-id', 'isCopiedExtraId');

  ractive.on('before-hide', () => {
    clearInterval(interval);
  });

  ractive.on('cancel', () => {
    details.set('changellyInfo', null).then(() => {
      emitter.emit('change-changelly-step', 'enterAmount');
    }).catch((err) => {
      console.error(err);
    });
  });

  ractive.on('help-extra-id', () => {
    showTooltip({
      // eslint-disable-next-line max-len
      message: translate('Property for addresses of currencies that use additional ID for transaction processing (e.g., destination tag, memo or message).'),
    });
  });

  ractive.on('help-network-fee', () => {
    showTooltip({
      // eslint-disable-next-line max-len
      message: translate('Network fee is fixed and taken each time wherever money is sent. Each currency has a strict amount taken for operations. This fee is taken once your funds are included in a blockchain.'),
    });
  });

  ractive.on('share', () => {
    window.plugins.socialsharing.shareWithOptions({
      message: getShareMessage(),
    });
  });

  ractive.on('email', () => {
    const message = getShareMessage();
    const link = 'mailto:?body=' + encodeURIComponent(`${message}\n\nSent from Coin Wallet\nhttps://coin.space`);
    window.safeOpen(link, '_blank');
  });

  function getShareMessage() {
    let message = ractive.get('depositAddress');
    const extraId = ractive.get('extraId');
    const extraIdLabel = ractive.get('extraIdLabel');
    if (extraId) {
      message = `${message} (${extraIdLabel}: ${extraId})`;
    }
    return message;
  }

  return ractive;
}
