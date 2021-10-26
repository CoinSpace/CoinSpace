import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import details from 'lib/wallet/details';
import template from './index.ract';
import footer from '../footer.ract';
import { getWalletById } from 'lib/wallet';

const symbolToCryptoId = {
  BTC: 'bitcoin@bitcoin',
  BCH: 'bitcoin-cash@bitcoin-cash',
  BSV: 'bitcoin-sv@bitcoin-sv',
  LTC: 'litecoin@litecoin',
  ETH: 'ethereum@ethereum',
  XRP: 'xrp@ripple',
  XLM: 'stellar@stellar',
  EOS: 'eos@eos',
  DOGE: 'dogecoin@dogecoin',
  DASH: 'dash@dash',
  XMR: 'monero@monero',
  USDT: 'ethereum@ethereum',
};

export default function(el) {
  const ractive = new Ractive({
    el,
    template,
    data: {
      toSymbol: '',
      toAddress: '',
      amount: '',
      payoutHash: '',
      txUrl: () => '',
      ref: process.env.CHANGELLY_REF,
    },
    partials: {
      footer,
    },
  });

  ractive.on('before-show', (context) => {
    const cryptoId = context.toCryptoId || symbolToCryptoId[context.toSymbol];
    const wallet = cryptoId && getWalletById(cryptoId);
    ractive.set({
      toSymbol: context.toSymbol,
      toAddress: context.toAddress,
      amount: context.amount,
      payoutHash: context.payoutHash,
      txUrl: wallet ? wallet.txUrl.bind(wallet) : () => context.payoutHashLink,
      cryptoId,
    });
  });

  ractive.on('done', () => {
    details.set('changellyInfo', null).then(() => {
      emitter.emit('change-changelly-step', 'enterAmount');
    }).catch((err) => {
      console.error(err);
    });
  });

  return ractive;
}
