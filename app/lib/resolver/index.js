import openalias from './openalias';
import unstoppabledomains from './unstoppabledomains';

export async function resolveTo(wallet, domain) {
  const results = await Promise.all([
    openalias(wallet.crypto, domain),
    unstoppabledomains(wallet.crypto, domain),
  ]);
  const address = results.find((result) => !!result);
  const data = address ? { to: address, alias: domain } : { to: domain, alias: '' };
  postProcess(wallet, data);
  return data;
}

function postProcess(wallet, data) {
  if (wallet.crypto._id !== 'bitcoin-cash@bitcoin-cash') return;
  const legacy = wallet.toLegacyAddress(data.to);
  if (!legacy) return;
  if (legacy === data.to) return;
  if (data.alias) {
    data.alias = `${data.alias} (${data.to})`;
  } else {
    data.alias = data.to;
  }
  data.to = legacy;
}

export default {
  resolveTo,
};
