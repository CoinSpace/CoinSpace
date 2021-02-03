'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const initChangelly = require('./changelly');
const initNone = require('./none');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
  });

  const exchanges = {
    changelly: initChangelly(ractive.find('#exchange_changelly')),
    none: initNone(ractive.find('#exchange_none')),
  };

  let currentExchange = exchanges.none;

  ractive.on('before-show', () => {
    if (process.env.BUILD_PLATFORM === 'mas') return showExchange(exchanges.none);

    const preferredExchange = window.localStorage.getItem('_cs_preferred_exchange');
    if (exchanges[preferredExchange]) {
      showExchange(exchanges[preferredExchange]);
    } else {
      showExchange(exchanges.none);
    }
  });

  ractive.on('before-hide', () => {
    currentExchange.hide();
  });

  emitter.on('set-exchange', (exchangeName) => {
    window.localStorage.setItem('_cs_preferred_exchange', exchangeName);
    showExchange(exchanges[exchangeName]);
  });

  function showExchange(exchange) {
    setTimeout(() => {
      currentExchange.hide();
      exchange.show();
      currentExchange = exchange;
    });
  }

  return ractive;
};
