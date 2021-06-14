import Ractive from 'widgets/modals/base';
import showConfirmAcceleration from 'widgets/modals/confirm-acceleration';
import { getWallet } from 'lib/wallet';
import { showInfo } from 'widgets/modals/flash';
import { walletCoins } from 'lib/crypto';
import contentEthereum from './contentEthereum.ract';
import contentRipple from './contentRipple.ract';
import contentStellar from './contentStellar.ract';
import contentEOS from './contentEOS.ract';
import contentMonero from './contentMonero.ract';
import contentBtcBchLtc from './contentBtcBchLtc.ract';

export default function(data) {
  let content;
  const { networkName } = getWallet();
  data.txUrl = walletCoins.find((coin) => coin.network === networkName).txUrl;
  data.networkName = networkName;
  data.showAllInputs = false;
  data.inputsPerPage = 10;
  if (networkName === 'ethereum') {
    data.isPendingFee = data.transaction.fee === -1;
    content = contentEthereum;
  } else if (networkName === 'ripple') {
    content = contentRipple;
  } else if (networkName === 'stellar') {
    content = contentStellar;
  } else if (networkName === 'eos') {
    content = contentEOS;
  } else if (networkName === 'monero') {
    content = contentMonero;
  } else {
    content = contentBtcBchLtc;
  }

  const ractive = new Ractive({
    partials: {
      content,
    },
    data,
  });

  ractive.on('showMoreInputs', (context) => {
    context.original.preventDefault();
    ractive.set('showAllInputs', true);
  });

  ractive.on('accelerate', () => {
    const wallet = getWallet();
    let tx;
    try {
      tx = wallet.createReplacement(data.transaction);
    } catch (err) {
      console.error('not translated error:', err);
      return showInfo({ title: err.message });
    }
    showConfirmAcceleration({
      el: ractive.el,
      fadeInDuration: 0,
      tx,
    });
  });

  return ractive;
}

