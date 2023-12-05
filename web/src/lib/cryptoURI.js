import { errors } from '@coinspace/cs-common';

export function parseCryptoURI(uri) {
  try {
    if (!uri.includes(':')) {
      uri = `crypto:${uri}`;
    }
    const parsed = new URL(uri);
    const scheme = parsed.protocol === 'crypto:' ? undefined
      : parsed.protocol.replace(/:$/, '').replace(/^web\+/, '');
    if (parsed.searchParams.has('address')) {
      // ERC 681
      // https://github.com/ethereum/ercs/blob/master/ERCS/erc-681.md
      return {
        scheme,
        address: parsed.searchParams.get('address'),
        token: parsed.pathname,
        amount: undefined,
      };
    }
    // BIP 21
    // https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki
    return {
      scheme,
      address: parsed.pathname,
      amount: parsed.searchParams.get('amount') || undefined,
    };
  } catch (err) {
    throw new errors.AddressError(`Invalid URI: "${uri}"`, { cause: err });
  }
}
