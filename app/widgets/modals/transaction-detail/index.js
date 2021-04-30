import Ractive from 'widgets/modals/base';
import showConfirmAcceleration from 'widgets/modals/confirm-acceleration';
import { getWallet } from 'lib/wallet';
import { showInfo } from 'widgets/modals/flash';
import contentEthereum from './contentEthereum.ract';
import contentRipple from './contentRipple.ract';
import contentStellar from './contentStellar.ract';
import contentEOS from './contentEOS.ract';
import contentBtcBchLtc from './contentBtcBchLtc.ract';

export default function(data) {
  let content;
  data.showAllInputs = false;
  data.inputsPerPage = 10;
  if (data.isNetwork('ethereum')) {
    data.isPendingFee = data.transaction.fee === -1;
    content = contentEthereum;
  } else if (data.isNetwork('ripple')) {
    content = contentRipple;
  } else if (data.isNetwork('stellar')) {
    content = contentStellar;
  } else if (data.isNetwork('eos')) {
    content = contentEOS;
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

