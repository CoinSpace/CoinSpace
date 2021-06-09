import Ractive from 'lib/ractive';
import emitter from 'lib/emitter';
import details from 'lib/wallet/details';
import template from './index.ract';
import footer from '../footer.ract';
import { walletCoins } from 'lib/crypto';

const symbolToNetwork = {
  BTC: 'bitcoin',
  BCH: 'bitcoincash',
  BSV: 'bitcoinsv',
  LTC: 'litecoin',
  ETH: 'ethereum',
  XRP: 'ripple',
  XLM: 'stellar',
  EOS: 'eos',
  DOGE: 'dogecoin',
  DASH: 'dash',
  XMR: 'monero',
  USDT: 'ethereum',
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
    },
    partials: {
      footer,
    },
  });

  ractive.on('before-show', (context) => {
    const network = symbolToNetwork[context.toSymbol];
    const walletCoin = network && walletCoins.find((coin) => coin.network === network);
    ractive.set({
      toSymbol: context.toSymbol,
      toAddress: context.toAddress,
      amount: context.amount,
      payoutHash: context.payoutHash,
      txUrl: walletCoin ? walletCoin.txUrl : () => context.payoutHashLink,
      network,
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
