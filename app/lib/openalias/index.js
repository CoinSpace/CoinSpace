'use strict';

const request = require('lib/request');
const { urlRoot } = window;

function resolveTo(network, to) {
  if (network !== 'bitcoin') return Promise.resolve({ to });

  to = to || '';
  const hostname = to.replace('@', '.');
  if (!hostname.match(/\./)) return Promise.resolve({ to });
  return request({
    url: urlRoot + 'api/v1/openalias?hostname=' + hostname,
  }).then((data) => {
    return { to: data.address, alias: to };
  }).catch(() => {
    return { to };
  });
}

module.exports = {
  resolveTo,
};
