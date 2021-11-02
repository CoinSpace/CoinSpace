import request from 'lib/request';
import { getWalletById } from 'lib/wallet';

export async function getAddressWithAlias(crypto, domain = '') {
  const address = await getAddress(crypto, domain);
  const data = address ? { address, alias: domain } : { address: domain, alias: '' };
  postProcess(crypto, data);
  return data;
}

async function getAddress(crypto, domain) {
  domain = domain.replace('@', '.');
  if (!/\./.test(domain)) return;
  try {
    const { address } = await request({
      url: process.env.SITE_URL + 'api/v3/domain/address',
      params: {
        crypto: crypto._id,
        domain,
      },
      seed: 'public',
    });
    return address;
    // eslint-disable-next-line no-empty
  } catch (err) {}
}

function postProcess(crypto, data) {
  if (crypto._id !== 'bitcoin-cash@bitcoin-cash') return;
  const wallet = getWalletById('bitcoin-cash@bitcoin-cash');
  const legacy = wallet.toLegacyAddress(data.address);
  if (!legacy) return;
  if (legacy === data.address) return;
  if (data.alias) {
    data.alias = `${data.alias} (${data.address})`;
  } else {
    data.alias = data.address;
  }
  data.address = legacy;
}

export default {
  getAddressWithAlias,
};
