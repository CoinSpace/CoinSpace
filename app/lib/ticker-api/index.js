'use strict';

const request = require('lib/request');
const { urlRoot } = window;
const LS = require('lib/wallet/localStorage');

let rates = {};

function init(id) {
  if (!id) {
    rates = {};
    return;
  }
  return request({
    url: `${urlRoot}api/v2/ticker?id=${LS.getId()}&crypto=${id}`,
    method: 'get',
    seed: 'public',
  }).catch((err) => {
    console.error(err);
    return {};
  }).then((data) => {
    rates = data.prices || {};

    if (id === 'bitcoin') {
      rates['mBTC'] = 1000;
      rates['μBTC'] = 1000000;
    } else if (id === 'bitcoincash') {
      rates['mBCH'] = 1000;
      rates['μBCH'] = 1000000;
    } else if (id === 'bitcoinsv') {
      rates['mBSV'] = 1000;
      rates['μBSV'] = 1000000;
    }
  });
}

module.exports = {
  init,
  getRates: () => rates,
};
