'use strict';

const dns = require('dns');
const retry = require('retry');

function resolve(hostname, callback) {
  const prefix = 'btc';
  const operation = retry.operation({
    retries: 3,
    factor: 1,
    minTimeout: 500,
    maxTimeout: 1000,
    randomize: true,
  });

  operation.attempt(() => {
    dns.resolveTxt(hostname, (err, addresses) => {
      if (operation.retry(err)) {
        return;
      }
      if (err) return callback(operation.mainError());

      for (let i = 0; i < addresses.length; i++) {
        const data = addresses[i][0];

        if (!data.match('^oa1:' + prefix)) continue;

        let match = data.match('recipient_address=([A-Za-z0-9]+)');
        if (!match) continue;
        const address = match[1];

        match = data.match('recipient_name=([^;]+)');
        const name = match ? match[1] : '';

        return callback(null, address, name);
      }
      return callback({ 'error': 'No OpenAlias record found.' });
    });
  });
}

module.exports = {
  resolve,
};
