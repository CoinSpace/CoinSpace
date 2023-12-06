import { errors } from '@coinspace/cs-common';

export function parseCryptoURI(uri) {
  try {
    if (!uri.includes(':')) {
      uri = `crypto:${uri}`;
    }
    const parsed = new URL(uri);
    const data = {};
    if (parsed.protocol !== 'crypto:') {
      data.scheme = parsed.protocol.replace(/:$/, '').replace(/^web\+/, '');
    }
    if (parsed.searchParams.has('address')) {
      // ERC 681
      // https://github.com/ethereum/ercs/blob/master/ERCS/erc-681.md
      data.address = parsed.searchParams.get('address');
      data.token = parsed.pathname;
    } else {
      // BIP 21 etc
      // https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki
      data.address = parsed.pathname;
      if (parsed.searchParams.has('amount')) {
        data.amount = parsed.searchParams.get('amount');
      }
      if (parsed.searchParams.has('dt')) {
        // https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0002d-destination-information
        data.destinationTag = parsed.searchParams.get('dt');
      }
    }
    return data;
  } catch (err) {
    throw new errors.AddressError(`Invalid URI: "${uri}"`, { cause: err });
  }
}
