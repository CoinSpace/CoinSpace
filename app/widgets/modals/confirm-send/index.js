import btcBchLtc from './btcBchLtc';
import ethereum from './ethereum';
import ripple from './ripple';
import stellar from './stellar';
import eos from './eos';
import monero from './monero';
import exchange from './exchange.ract';

function open(options) {
  const { wallet, type } = options;
  const { platform, symbol } = options.wallet.crypto;
  let blockchain, feeSymbol = symbol;
  if (wallet.platformCrypto) {
    feeSymbol = wallet.platformCrypto.symbol;
    blockchain = wallet.platformCrypto.name;
  }
  const content = type === 'exchange' && exchange;
  const cryptoOptions = {
    wallet,
    tx: options.tx,
    importTxOptions: options.importTxOptions,
    onSuccess: options.onSuccess,
    content,
    data: {
      amount: options.amount,
      symbol,
      feeSymbol,
      blockchain,
      isImport: type === 'import',
      alias: options.alias,
      to: options.to,
      fee: options.fee,
      feeSign: type === 'import' ? '-' : '+',
      memo: options.memo,
      tag: options.tag,
      invoiceId: options.invoiceId,
      exchangeTo: options.exchangeTo,
      fadeInDuration: options.fadeInDuration,
    },
  };

  if (['ethereum', 'binance-smart-chain', 'c-chain', 'ethereum-classic'].includes(platform)) {
    return ethereum(cryptoOptions);
  } else if (platform === 'ripple') {
    return ripple(cryptoOptions);
  } else if (platform === 'stellar') {
    return stellar(cryptoOptions);
  } else if (platform === 'eos') {
    return eos(cryptoOptions);
  } else if (platform === 'monero') {
    return monero(cryptoOptions);
  } else {
    // default 'bitcoin', 'bitcoin-cash', 'bitcoin-sv', 'litecoin', 'dogecoin', 'dash', 'cardano', 'solana' etc
    return btcBchLtc(cryptoOptions);
  }
}

export default open;
