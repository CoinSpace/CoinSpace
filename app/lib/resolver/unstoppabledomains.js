import request from 'lib/request';

async function resolveTo(crypto, domain = '') {
  if (!/\./.test(domain)) return;
  try {
    const { address } = await request({
      url: process.env.SITE_URL + 'api/v3/unstoppabledomains/resolution',
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

export default resolveTo;
