import Ractive from '../ractive';
import emitter from 'lib/emitter';
import details from 'lib/wallet/details';
import template from './index.ract';
import { getWalletById } from 'lib/wallet';
import crypto from 'lib/crypto';

// TODO: remove
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
    },
  });

  ractive.on('before-show', async (context) => {
    const cryptos = await crypto.getCryptos();
    const cryptoId = context.toCryptoId || symbolToCryptoId[context.toSymbol];
    const toCrypto = cryptos.find((item) => item._id === cryptoId);
    const wallet = toCrypto && getWalletById(toCrypto._id);
    ractive.set({
      toCrypto,
      toAddress: context.toAddress,
      amount: context.amount,
      payoutHash: context.payoutHash,
      txUrl: wallet ? wallet.txUrl.bind(wallet) : () => context.payoutHashLink,
    });
  });

  ractive.on('done', () => {
    details.set('changellyInfo', null).then(() => {
      emitter.emit('change-changelly-step', 'create');
    }).catch((err) => {
      console.error(err);
    });
  });

  return ractive;
}
