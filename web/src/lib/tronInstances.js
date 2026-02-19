import { HDKey } from '@scure/bip32';
import { hex } from '@scure/base';
import { Address, getPublicKeyFromPrivateKey } from 'tronlib';

export function tronBip44(index) {
  const i = Math.max(0, parseInt(index, 10) || 0);
  return `m/44'/195'/${i}'`;
}

export function instanceStorageName(cryptoId, instanceIndex) {
  const index = parseInt(instanceIndex, 10);
  if (!Number.isInteger(index) || index <= 0) {
    // keep legacy storage name for instance 0
    return cryptoId;
  }
  const [asset, platform] = cryptoId.split('@');
  return `${asset}:${index}@${platform}`;
}

export function instanceCacheKey(cryptoId, instanceIndex) {
  return instanceStorageName(cryptoId, instanceIndex);
}

export function deriveTronKeypair({ seed, bip44Path }) {
  const hdkey = HDKey.fromMasterSeed(seed).derive(bip44Path);
  const privateKey = hdkey.privateKey;
  const publicKey = getPublicKeyFromPrivateKey(privateKey);
  const address = Address.fromPublicKey(publicKey).toBase58Check();
  return {
    address,
    privateKey: hex.encode(privateKey),
    publicKey: hex.encode(publicKey),
  };
}
