'use strict';

const request = require('lib/request');
const { urlRoot } = window;

let rates = {};

function init(cryptoId) {
  if (!cryptoId) {
    rates = {};
    return;
  }
  return request({
    url: `${urlRoot}api/v2/ticker`,
    params: {
      crypto: cryptoId,
    },
    method: 'get',
    seed: 'public',
  }).catch((err) => {
    console.error(err);
    return {};
  }).then((data) => {
    rates = data.prices || {};

    if (cryptoId === 'bitcoin') {
      rates['mBTC'] = 1000;
      rates['μBTC'] = 1000000;
    } else if (cryptoId === 'bitcoincash') {
      rates['mBCH'] = 1000;
      rates['μBCH'] = 1000000;
    } else if (cryptoId === 'bitcoinsv') {
      rates['mBSV'] = 1000;
      rates['μBSV'] = 1000000;
    }
  });
}

module.exports = {
  init,
  getRates: () => rates,
};
