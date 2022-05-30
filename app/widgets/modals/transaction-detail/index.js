import Ractive from 'widgets/modals/base';
import showConfirmAcceleration from 'widgets/modals/confirm-acceleration';
import { getWallet } from 'lib/wallet';
import { showInfo } from 'widgets/modals/flash';
import contentEthereum from './contentEthereum.ract';
import contentRipple from './contentRipple.ract';
import contentStellar from './contentStellar.ract';
import contentEOS from './contentEOS.ract';
import contentMonero from './contentMonero.ract';
import contentSolana from './contentSolana.ract';
import contentDefault from './contentDefault.ract';
import { translate } from 'lib/i18n';
import strftime from 'strftime';
import { toUnitString } from 'lib/convert';

export default function({ transaction }) {
  let content;
  const wallet = getWallet();
  const { platform } = wallet.crypto;
  if (['ethereum', 'binance-smart-chain', 'avalanche-c-chain', 'ethereum-classic'].includes(platform)) {
    content = contentEthereum;
  } else if (platform === 'ripple') {
    content = contentRipple;
  } else if (platform === 'stellar') {
    content = contentStellar;
  } else if (platform === 'eos') {
    content = contentEOS;
  } else if (platform === 'monero') {
    content = contentMonero;
  } else if (platform === 'solana') {
    content = contentSolana;
  } else {
    content = contentDefault;
  }
  const ractive = new Ractive({
    partials: {
      content,
    },
    data: {
      transaction,
      txUrl(txId) {
        return wallet.txUrl(txId);
      },
      showAllInputs: false,
      inputsPerPage: 10,
      formatTimestamp(timestamp) {
        return strftime('%b %d, %Y %l:%M %p', new Date(timestamp));
      },
      toUnitString,
    },
  });

  ractive.on('showMoreInputs', (context) => {
    context.original.preventDefault();
    ractive.set('showAllInputs', true);
  });

  ractive.on('accelerate', () => {
    const wallet = getWallet();
    let tx;
    try {
      tx = wallet.createReplacement(transaction);
    } catch (err) {
      if (/Insufficient funds/.test(err.message)) return showInfo({ title: translate('Insufficient funds') });
      console.error(`not translated error: ${err.message}`);
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

