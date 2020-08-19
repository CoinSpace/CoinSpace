'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const db = require('lib/db');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      toSymbol: '',
      toAddress: '',
      amount: '',
    },
    partials: {
      footer: require('../footer.ract'),
    },
  });

  ractive.on('before-show', (context) => {
    ractive.set({
      toSymbol: context.toSymbol,
      toAddress: context.toAddress,
      amount: context.amount,
    });
  });

  ractive.on('done', () => {
    db.set('changellyInfo', null).then(() => {
      emitter.emit('change-changelly-step', 'enterAmount');
    }).catch((err) => {
      console.error(err);
    });
  });

  return ractive;
};
