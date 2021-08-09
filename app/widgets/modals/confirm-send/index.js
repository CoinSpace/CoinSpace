import btcBchLtc from './btcBchLtc';
import ethereum from './ethereum';
import ripple from './ripple';
import stellar from './stellar';
import eos from './eos';
import monero from './monero';

function open(data) {
  const network = data.wallet.networkName;
  if (['bitcoin', 'bitcoincash', 'bitcoinsv', 'litecoin', 'dogecoin', 'dash'].indexOf(network) !== -1) {
    return btcBchLtc(data);
  } else if (['ethereum', 'binance-smart-chain'].includes(network)) {
    return ethereum(data);
  } else if (network === 'ripple') {
    return ripple(data);
  } else if (network === 'stellar') {
    return stellar(data);
  } else if (network === 'eos') {
    return eos(data);
  } else if (network === 'monero') {
    return monero(data);
  }
}

export default open;
