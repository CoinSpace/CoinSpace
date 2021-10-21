import request from 'lib/request';

async function resolveTo(crypto, domain = '') {
  if (crypto._id !== 'bitcoin@bitcoin') return;
  domain = domain.replace('@', '.');
  if (!/\./.test(domain)) return;
  try {
    const { address } = await request({
      url: process.env.SITE_URL + 'api/v3/openalias',
      params: {
        hostname: domain,
      },
      seed: 'public',
    });
    return address;
    // eslint-disable-next-line no-empty
  } catch (err) {}
}

export default resolveTo;
