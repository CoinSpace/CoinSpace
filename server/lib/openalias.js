import dns from 'dns';
import retry from 'retry';
import createError from 'http-errors';

function resolve(hostname) {
  const prefix = 'btc';
  const operation = retry.operation({
    retries: 3,
    factor: 1,
    minTimeout: 500,
    maxTimeout: 1000,
    randomize: true,
  });

  return new Promise((done, fail) => {
    operation.attempt(() => {
      dns.resolveTxt(hostname, (err, addresses) => {
        if (operation.retry(err)) {
          return;
        }
        if (err) return fail(createError(400, operation.mainError()));

        for (let i = 0; i < addresses.length; i++) {
          const data = addresses[i][0];

          if (!data.match('^oa1:' + prefix)) continue;

          let match = data.match('recipient_address=([A-Za-z0-9]+)');
          if (!match) continue;
          const address = match[1];

          match = data.match('recipient_name=([^;]+)');
          const name = match ? match[1] : '';

          return done({ address, name });
        }
        return fail(createError(400, 'No OpenAlias record found.'));
      });
    });
  });
}

export default {
  resolve,
};
