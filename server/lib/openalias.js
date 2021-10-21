import { promises as dns } from 'dns';
import createError from 'http-errors';

async function resolveTo(hostname) {
  const prefix = 'btc';
  try {
    const addresses = await dns.resolveTxt(hostname);
    for (let i = 0; i < addresses.length; i++) {
      const data = addresses[i][0];

      if (!data.match('^oa1:' + prefix)) continue;

      let match = data.match('recipient_address=([A-Za-z0-9]+)');
      if (!match) continue;
      const address = match[1];

      match = data.match('recipient_name=([^;]+)');
      const name = match ? match[1] : '';
      return { address, name };
    }
    // eslint-disable-next-line no-empty
  } catch (err) {}
  throw createError(400, 'No OpenAlias record found.');
}

export default {
  resolveTo,
};
