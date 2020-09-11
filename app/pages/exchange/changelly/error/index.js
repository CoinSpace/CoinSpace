'use strict';

const Ractive = require('lib/ractive');
const emitter = require('lib/emitter');
const details = require('lib/wallet/details');
const { translate } = require('lib/i18n');

module.exports = function(el) {
  const ractive = new Ractive({
    el,
    template: require('./index.ract'),
    data: {
      message: '',
      showEmail: true,
    },
    partials: {
      footer: require('../footer.ract'),
    },
  });

  ractive.on('before-show', (context) => {
    ractive.set('message', translate(context.message, context.interpolations));
    ractive.set('showEmail', !!context.showEmail);
  });

  ractive.on('close', () => {
    details.set('changellyInfo', null).then(() => {
      emitter.emit('change-changelly-step', 'enterAmount');
    }).catch((err) => {
      console.error(err);
    });
  });

  return ractive;
};
