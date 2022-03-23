import bitcoin from '@coinspace/crypto-db/crypto/bitcoin@bitcoin.json';
import litecoin from '@coinspace/crypto-db/crypto/litecoin@litecoin.json';
import dash from '@coinspace/crypto-db/crypto/dash@dash.json';
import bitcoinCash from '@coinspace/crypto-db/crypto/bitcoin-cash@bitcoin-cash.json';
import bitcoinSv from '@coinspace/crypto-db/crypto/bitcoin-sv@bitcoin-sv.json';
import ethereum from '@coinspace/crypto-db/crypto/ethereum@ethereum.json';
import dogecoin from '@coinspace/crypto-db/crypto/dogecoin@dogecoin.json';
import xrp from '@coinspace/crypto-db/crypto/xrp@ripple.json';
import stellar from '@coinspace/crypto-db/crypto/stellar@stellar.json';
import eos from '@coinspace/crypto-db/crypto/eos@eos.json';
import monero from '@coinspace/crypto-db/crypto/monero@monero.json';
import cardano from '@coinspace/crypto-db/crypto/cardano@cardano.json';

const cryptoSchemes = [
  bitcoin,
  bitcoinCash,
  bitcoinSv,
  litecoin,
  ethereum,
  xrp,
  stellar,
  eos,
  dogecoin,
  dash,
  monero,
  cardano,
].map((item) => {
  return {
    scheme: item.scheme,
    cryptoId: item._id,
  };
});

function getSchemeCryptoId(url) {
  if (!url) return false;
  const scheme = url.split(':')[0];
  const item = cryptoSchemes.find((item) => item.scheme === scheme);
  if (!item) return false;
  return item.cryptoId;
}

function decode(url) {
  url = url || '';
  const address = url.split('?')[0].split(':').pop();
  const data = { address };
  let match;
  match = url.match(/amount=([0-9.]+)/);
  if (match && match[1]) {
    data.value = match[1];
  }
  match = url.match(/dt=(\d+)/);
  if (match && match[1]) {
    data.tag = match[1];
  }
  return data;
}

function registerProtocolHandler(crypto) {
  if (process.env.BUILD_PLATFORM !== 'web') return;
  if (!navigator.registerProtocolHandler) return;
  const item = cryptoSchemes.find((item) => item.cryptoId === crypto._id);
  if (!item) return;
  const { scheme } = item;
  try {
    navigator.registerProtocolHandler(
      scheme,
      `${process.env.SITE_URL}wallet/?crypto=${crypto._id}&bip21=%s`, 'Coin Wallet'
    );
    // eslint-disable-next-line
  } catch (e) {}
}

export default {
  getSchemeCryptoId,
  decode,
  registerProtocolHandler,
};
