import request from 'lib/request';

export function resolveTo(network, to) {
  if (network !== 'bitcoin') return Promise.resolve({ to });

  to = to || '';
  const hostname = to.replace('@', '.');
  if (!hostname.match(/\./)) return Promise.resolve({ to });
  return request({
    url: process.env.SITE_URL + 'api/v1/openalias?hostname=' + hostname,
    id: true,
  }).then((data) => {
    return { to: data.address, alias: to };
  }).catch(() => {
    return { to };
  });
}

export default {
  resolveTo,
};
