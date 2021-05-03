import request from 'lib/request';
import emitter from 'lib/emitter';

let rates = {};

function init(crypto) {
  const cryptoIds = crypto.map((item) => {
    if (typeof item === 'string') {
      return item;
    }
    if (item._id) {
      return item._id;
    }
  }).filter((item) => !!item);
  if (!cryptoIds.length) {
    emitter.emit('rates-updated', rates);
    return;
  }
  return request({
    url: `${process.env.SITE_URL}api/v2/tickers`,
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

function getAllRates() {
  return rates;
}

function getRates(cryptoId) {
  return rates[cryptoId] || {};
}

export default {
  init,
  getAllRates,
  getRates,
};
