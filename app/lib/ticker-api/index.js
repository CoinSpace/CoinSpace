'use strict';

const request = require('lib/request');
const { urlRoot } = window;
let rates = {};

async function load(crypto) {
  try {
    const url = urlRoot + 'v1/ticker?crypto=' + crypto;
    rates = await request({ url });
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  load,
  getRates: () => rates,
};
