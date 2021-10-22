import request from 'lib/request';

export async function getAddressWithAlias(wallet, domain = '') {
  const address = await getAddress(wallet, domain);
  const data = address ? { address, alias: domain } : { address: domain, alias: '' };
  postProcess(wallet, data);
  return data;
}

async function getAddress(wallet, domain) {
  domain = domain.replace('@', '.');
  if (!/\./.test(domain)) return;
  try {
    const { address } = await request({
      url: process.env.SITE_URL + 'api/v3/domain/address',
      params: {
        crypto: wallet.crypto._id,
        domain,
      },
      seed: 'public',
    });
    return address;
    // eslint-disable-next-line no-empty
  } catch (err) {}
}

function postProcess(wallet, data) {
  if (wallet.crypto._id !== 'bitcoin-cash@bitcoin-cash') return;
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
