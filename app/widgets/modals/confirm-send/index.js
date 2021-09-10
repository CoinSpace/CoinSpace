import btcBchLtc from './btcBchLtc';
import ethereum from './ethereum';
import ripple from './ripple';
import stellar from './stellar';
import eos from './eos';
import monero from './monero';

function open(data) {
  const { platform } = data.wallet.crypto;
  if (['bitcoin', 'bitcoin-cash', 'bitcoin-sv', 'litecoin', 'dogecoin', 'dash'].indexOf(platform) !== -1) {
    return btcBchLtc(data);
  } else if (['ethereum', 'binance-smart-chain'].includes(platform)) {
    return ethereum(data);
  } else if (platform === 'ripple') {
    return ripple(data);
  } else if (platform === 'stellar') {
    return stellar(data);
  } else if (platform === 'eos') {
    return eos(data);
  } else if (platform === 'monero') {
    return monero(data);
  }
}

export default open;
