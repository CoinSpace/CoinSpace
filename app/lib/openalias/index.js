'use strict';

const request = require('lib/request');
const { urlRoot } = window;
const { getTokenNetwork } = require('lib/token');

function resolveTo(to) {
  if (getTokenNetwork() !== 'bitcoin') return Promise.resolve({ to });

  to = to || '';
  const hostname = to.replace('@', '.');
  if (!hostname.match(/\./)) return Promise.resolve({ to });
  return request({
    url: urlRoot + 'v1/openalias?hostname=' + hostname,
  }).then((data) => {
    return { to: data.address, alias: to };
  }).catch(() => {
    return { to };
  });
}

module.exports = {
  resolveTo,
};
