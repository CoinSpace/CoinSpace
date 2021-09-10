import request from 'lib/request';
import emitter from 'lib/emitter';

let rates = {};

function init(cryptos) {
  const cryptoIds = cryptos.filter((item) => !!item.coingecko).map((item) => item._id);
  if (!cryptoIds.length) {
    emitter.emit('rates-updated', rates);
    return;
  }
  return request({
    url: `${process.env.SITE_URL}api/v3/tickers`,
    params: {
      crypto: cryptoIds.join(','),
    },
    method: 'get',
    seed: 'public',
  }).catch((err) => {
    console.error(err);
    rates = {};
    emitter.emit('rates-updated', rates);
  }).then((data) => {
    for (const item of data) {
      rates[item._id] = item.prices;
    }
    emitter.emit('rates-updated', rates);
  });
}

function getRates(cryptoId) {
  return rates[cryptoId] || {};
}

export default {
  init,
  getRates,
};
